import logging
import json
from aiohttp import ClientResponse, ClientResponseError
from graphql import DocumentNode, ExecutionResult, print_ast
from gql.transport.exceptions import TransportProtocolError, TransportServerError
from gql.transport.aiohttp import AIOHTTPTransport
from gql.transport.websockets import WebsocketsTransport
from typing import Any, AsyncGenerator, Dict, Optional, Tuple, Union


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d: %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class IMGArenaHTTPTransport(AIOHTTPTransport):
    def _hash(self, e):
        t = 5381
        r = len(e)

        while r:
            r -= 1
            t = t * 33 ^ ord(e[r])

        return t & 0xFFFFFFFF

    def _create_hash_id(self, query, operation, variables):
        obj = {
            "operationName": operation,
            "query": query,
            "variables": variables
        }

        obj_str = json.dumps(
            obj,
            separators=(',', ':'),
            sort_keys=True
        )

        return self._hash(obj_str)

    async def execute(
            self,
            document: Union[DocumentNode, str] = None,
            variable_values: Optional[Dict[str, Any]] = None,
            operation_name: Optional[str] = None
    ) -> Optional[ExecutionResult]:

        query_id = self._create_hash_id(query=document,
                                        variables=variable_values,
                                        operation=operation_name)
        self.headers['gql-op-name'] = operation_name

        async with self.session.request(url=f'{self.url}?hash={query_id}', method='GET', headers=self.headers) as r:
            async def raise_response_error(r: ClientResponse, reason: str):
                try:
                    # Raise a ClientResponseError if response status is 400 or higher
                    r.raise_for_status()
                except ClientResponseError as e:
                    raise TransportServerError(str(e), e.status) from e

                result_text = await r.text()
                raise TransportProtocolError(
                    f"Server did not return a GraphQL result: "
                    f"{reason}: "
                    f"{result_text}"
                )

            try:
                result = await r.json()

            except Exception:
                await raise_response_error(r, "Not a JSON answer")

            if result is None:
                await raise_response_error(r, "Not a JSON answer")

            if "errors" not in result and "data" not in result:
                await raise_response_error(r, 'No "data" or "errors" keys in answer')

            return ExecutionResult(
                errors=result.get("errors"),
                data=result.get("data"),
                extensions=result.get("extensions"),
            )


class IMGArenaWebsocketsTransport(WebsocketsTransport):
    def _hash(self, e):
        t = 5381
        r = len(e)

        while r:
            r -= 1
            t = t * 33 ^ ord(e[r])

        return t & 0xFFFFFFFF

    def _create_hash_id(self, subscription_name: str, variables: str):
        obj = {
            'subscriptionName': subscription_name,
            'variables': variables,
        }

        obj_str = json.dumps(
            obj,
            separators=(',', ':'),
            sort_keys=True,
        )

        hashed_value = self._hash(obj_str)

        return hashed_value

    async def _send_query(
            self,
            doc: DocumentNode,
            variable_values: Optional[Dict],
            operation: Optional[str]
    ) -> int:
        # calculate the id by hashing the subscription name and the variables
        query_id = self._create_hash_id(self.latest_subscription_name, variable_values)

        # create the payload for the full subscription
        payload = {'query': print_ast(doc)}

        if variable_values:
            payload['variables'] = variable_values

        if operation:
            payload['operationName'] = operation
            payload['subscriptionName'] = self.latest_subscription_name

        # saving the full query first and wait for the server to request it later
        self.saved_full_subscriptions[str(query_id)] = payload

        # start to request the subscription with the operation name
        query_str = json.dumps(
            {
                'id': str(query_id),
                'type': 'start',
                'operationName': operation,
                'eventId': self.latest_event_id,
            }
        )

        await self._send(query_str)

        return query_id

    async def subscribe(
            self,
            doc: DocumentNode,
            variable_values: Optional[Dict],
            operation_name: str,
            subscription_name: str,
            event_id: int,
            send_stop: Optional[bool] = False
    ) -> AsyncGenerator[ExecutionResult, None]:

        self.latest_event_id = event_id
        self.latest_subscription_name = subscription_name

        async for result in super().subscribe(
                document=doc,
                variable_values=variable_values,
                operation_name=operation_name,
                send_stop=send_stop,
        ):
            yield result

    async def _wait_ack(self) -> None:
        self.saved_full_subscriptions = {}

        while True:
            init_answer = await self._receive()
            answer_type, answer_id, execution_result = self._parse_answer(init_answer)

            if answer_type == 'wsIdentity':
                return None

            raise TransportProtocolError(
                'Websocket server did not return a wsIdentity response'
            )

    def _parse_answer(self, answer: str) -> Tuple[str, Optional[int], Optional[ExecutionResult]]:
        try:
            json_answer = json.loads(answer)
        except ValueError:
            raise TransportProtocolError(
                f'Server did not return a GraphQL result: {answer}'
            )

        if 'wsIdentity' in json_answer:
            return 'wsIdentity', json_answer['wsIdentity'], None

        elif 'type' in json_answer and json_answer['type'] == 'request-full-subscription':
            return 'request-full-subscription', json_answer['id'], None

        else:
            return self._parse_answer_apollo(json_answer)

    async def send_full_subscription(self, answer_id: Optional[int]):
        if answer_id not in self.saved_full_subscriptions:
            raise Exception(f'full subscription not found for id {answer_id}')

        payload = self.saved_full_subscriptions[answer_id]

        query_str = json.dumps(
            {'id': answer_id, 'type': 'full-subscription', 'payload': payload}
        )

        await self._send(query_str)

    async def _handle_answer(
            self,
            answer_type: str,
            answer_id: Optional[int],
            execution_result: Optional[ExecutionResult],
    ) -> None:

        if answer_type == 'request-full-subscription':
            await self.send_full_subscription(answer_id)

        else:
            await super()._handle_answer(answer_type, answer_id, execution_result)