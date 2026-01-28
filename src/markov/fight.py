import numpy as np
import networkx as nx
from scripts.graph import build_T
from scripts.markov.markov import Markov
from scripts.database.database import get_markov_id
from typing import Any, List, Optional


A = 4  # number of absorbing states


class Fight(Markov):
    def __init__(self, G: nx.MultiDiGraph, **kwargs: Any):
        self.T = build_T(G=G)
        self.nodes = np.array(G.nodes, dtype=int)
        self.nodes_idx   = dict([(y, x) for x, y in enumerate(G.nodes)])
        self.r_nodes_idx = dict([(y, x) for x, y in enumerate(list(G.nodes)[A:])])
        self.strikes_attempted = kwargs.get('strikes attempted', ['SSHA', 'SGHA', 'SSBA', 'SGBA'])
        self.strikes_landed    = kwargs.get('strikes landed',    ['SSHL', 'SGHL', 'SSBL', 'SGBL'])
        self.elbows_landed     = kwargs.get('elbows landed',     ['EGHL', 'ESHL'])
        self.kicks_landed      = kwargs.get('kicks landed',      ['KIGHL', 'KISHL'])
        self.knees_landed      = kwargs.get('knees landed',      ['KNGHL', 'KNSHL'])
        self.n_rounds = kwargs.get('n_rounds', 3)
        self.t  = kwargs.get('t',  300)
        self.dt = kwargs.get('dt', 1)
        self.n_steps = int(self.t * (1 / self.dt))

        super().__init__(
            T=self.T,
            i=self.i_standing,
            n=self.n_steps,
            seed=None
        )

    @property
    def i_standing(self) -> int:
        """
        Standing
        """
        id = get_markov_id(abbreviation='ST')
        i  = self.nodes_idx[id]

        return i

    @property
    def i_knockout_blue(self) -> int:
        """
        Fighter blue lands a KO
        """
        id = get_markov_id(abbreviation='KOL', fighter='blue')
        i  = self.nodes_idx[id]

        return i

    @property
    def i_knockout_red(self) -> int:
        """
        Fighter red lands a KO
        """
        id = get_markov_id(abbreviation='KOL', fighter='red')
        i  = self.nodes_idx[id]

        return i

    @property
    def i_submission_blue(self) -> int:
        """
        Fighter blue lands a submission
        """
        id = get_markov_id(abbreviation='SML', fighter='blue')
        i  = self.nodes_idx[id]

        return i

    @property
    def i_submission_red(self) -> int:
        """
        Fighter red lands a submission
        """
        id = get_markov_id(abbreviation='SML', fighter='red')
        i  = self.nodes_idx[id]

        return i

    @property
    def i_submission_attempts_blue(self) -> int:
        """
        Submission attempt by fighter blue
        """
        id = get_markov_id(abbreviation='SMA', fighter='blue')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_submission_attempts_red(self) -> int:
        """
        Submission attempt by fighter red
        """
        id = get_markov_id(abbreviation='SMA', fighter='red')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_strikes_attempted_blue(self) -> List[int]:
        """
        Strikes attempted by fighter blue
        """
        ids = [get_markov_id(abbreviation=x, fighter='blue') for x in self.strikes_attempted]
        i   = [self.r_nodes_idx[id] for id in ids]

        return i

    @property
    def i_strikes_attempted_red(self) -> List[int]:
        """
        Strikes landed by fighter red
        """
        ids = [get_markov_id(abbreviation=x, fighter='red') for x in self.strikes_attempted]
        i   =  [self.r_nodes_idx[id] for id in ids]

        return i

    @property
    def i_strikes_landed_blue(self) -> List[int]:
        """
        Strikes landed by fighter blue
        """
        ids = [get_markov_id(abbreviation=x, fighter='blue') for x in self.strikes_landed]
        i   = [self.r_nodes_idx[id] for id in ids]

        return i

    @property
    def i_strikes_landed_red(self) -> List[int]:
        """
        Strikes landed by fighter red
        """
        ids = [get_markov_id(abbreviation=x, fighter='red') for x in self.strikes_landed]
        i   =  [self.r_nodes_idx[id] for id in ids]

        return i

    @property
    def i_takedown_landed_blue(self) -> int:
        """
        Takedowns landed by fighter blue
        """
        id = get_markov_id(abbreviation='TDL', fighter='blue')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_takedown_landed_red(self) -> int:
        """
        Takedown landed by fighter red
        """
        id = get_markov_id(abbreviation='TDL', fighter='red')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_knockdown_blue(self) -> int:
        """
        Knockdown landed by fighter blue
        """
        id = get_markov_id(abbreviation='KDL', fighter='blue')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_knockdown_red(self) -> int:
        """
        Knockdown landed by fighter red
        """
        id = get_markov_id(abbreviation='KDL', fighter='red')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_misc_control_blue(self) -> int:
        """
        Miscellaneous control by fighter blue
        """
        id = get_markov_id(abbreviation='MGC', fighter='blue')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_misc_control_red(self) -> int:
        """
        Miscellaneous control by fighter red
        """
        id = get_markov_id(abbreviation='MGC', fighter='red')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_ground_control_blue(self) -> int:
        """
        Ground control by fighter blue
        """
        id = get_markov_id(abbreviation='GRC', fighter='blue')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def i_ground_control_red(self) -> int:
        """
        Ground control by fighter red
        """
        id = get_markov_id(abbreviation='GRC', fighter='red')
        i  = self.r_nodes_idx[id]

        return i

    @property
    def p_knockout_blue(self) -> np.ndarray:
        """
        Probability of a knockout in a single round by fighter blue
        """
        return self.h(j=self.i_knockout_blue).squeeze(1)

    @property
    def p_knockout_red(self) -> np.ndarray:
        """
        Probability of a knockout in a single round by fighter red
        """
        return self.h(j=self.i_knockout_red).squeeze(1)

    @property
    def p_submission_blue(self) -> np.ndarray:
        """
        Probability of a submission in a single round by fighter blue
        """
        return self.h(j=self.i_submission_blue).squeeze(1)

    @property
    def p_submission_red(self) -> np.ndarray:
        """
        Probability of a submission in a single round by fighter red
        """
        return self.h(j=self.i_submission_red).squeeze(1)

    @property
    def p_over_half_round(self) -> np.ndarray:
        """
        Probability of being in a t§ransient state after a half round
        """
        n   = int(self.n_steps / 2 + 1)
        Q_n = np.linalg.matrix_power(self.Q, n)

        return np.sum(Q_n[:, 0], axis=1)

    @property
    def p_round(self) -> np.ndarray:
        """
        Probability of being in a transient states after a single round
        """
        Q_n = np.linalg.matrix_power(self.Q, self.n)

        return np.sum(Q_n[:, 0], axis=1)

    @property
    def p_rounds(self) -> np.ndarray:
        powers = np.arange(self.n_rounds + 1)
        p = np.power(self.p_round[:, None], powers[None, :])

        return p

    @property
    def p_to_the_distance(self) -> np.ndarray:
        """
        Probability that fight goes to the distance
        """
        return self.p_rounds[:, -1]

    @property
    def p_knockouts_blue(self) -> np.ndarray:
        """
        Probabilities that fighter blue is winner by knockout
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_blue, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_red(self) -> np.ndarray:
        """
        Probabilities that fighter red is winner by knockout
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_red, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_submissions_blue(self) -> np.ndarray:
        """
        Probabilities that fighter blue is winner by submission
        """
        p = np.einsum('sn, sr -> snr', self.p_submission_blue, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_submissions_red(self) -> np.ndarray:
        """
        Probabilities that fighter red is winner by submission
        """
        p = np.einsum('sn, sr -> snr', self.p_submission_red, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockout_by_elbow_blue(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by an elbow in a single round by fighter blue
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='blue') for abbreviation in self.elbows_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_blue)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockout_by_elbow_red(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by an elbow in a single round by fighter red
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='red') for abbreviation in self.elbows_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_red)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockout_by_kick_blue(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by a kick in a single round by fighter blue
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='blue') for abbreviation in self.kicks_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_blue)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockout_by_kick_red(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by a kick in a single round by fighter red
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='red') for abbreviation in self.kicks_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_red)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockout_by_knee_blue(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by a knee in a single round by fighter blue
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='blue') for abbreviation in self.knees_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_blue)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockout_by_knee_red(self) -> Optional[np.ndarray]:
        """
        Probability of a knockout by a knee in a single round by fighter blue
        """
        ids = [get_markov_id(abbreviation=abbreviation, fighter='red') for abbreviation in self.knees_landed]

        try:
            i = self.r_nodes_idx[ids]
            p = self.p_X_at_tau_minus_1(j=i, k=self.i_knockout_red)

            return np.sum(p, axis=(1, 2))

        except KeyError:
            return None

    @property
    def p_knockouts_by_elbow_blue(self) -> np.ndarray:
        """
        Probabilities that fighter blue is winner by knockout by an elbow
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_elbow_blue, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_by_elbow_red(self) -> np.ndarray:
        """
        Probabilities that fighter red is winner by knockout by an elbow
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_elbow_red, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_by_knee_blue(self) -> np.ndarray:
        """
        Probabilities that fighter blue is winner by knockout by a knee
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_knee_blue, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_by_knee_red(self) -> np.ndarray:
        """
        Probabilities that fighter red is winner by knockout by a knee
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_knee_red, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_by_kick_blue(self) -> np.ndarray:
        """
        Probabilities that fighter blue is winner by knockout by a kick
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_kick_blue, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)

    @property
    def p_knockouts_by_kick_red(self) -> np.ndarray:
        """
        Probabilities that fighter red is winner by knockout by a kick
        """
        p = np.einsum('sn, sr -> snr', self.p_knockout_by_kick_red, self.p_rounds[:, :-1])

        return p.reshape(self.n_samples, -1)


    @property
    def n_strikes_attempted_blue(self) -> np.ndarray:
        """
        Number of strikes attempted by fighter blue
        """
        return np.sum(self.N[:, self.i_standing, self.i_strikes_attempted_blue], axis=1)

    @property
    def n_strikes_attempted_red(self) -> np.ndarray:
        """
        Number of strikes attempted by fighter red
        """
        return np.sum(self.N[:, self.i_standing, self.i_strikes_attempted_red], axis=1)

    @property
    def n_strikes_landed_blue(self) -> np.ndarray:
        """
        Number of strikes landed by fighter blue
        """
        return np.sum(self.N[:, self.i_standing, self.i_strikes_landed_blue], axis=1)

    @property
    def n_strikes_landed_red(self) -> np.ndarray:
        """
        Number of strikes landed by fighter red
        """
        return np.sum(self.N[:, self.i_standing, self.i_strikes_landed_red], axis=1)


    @property
    def n_takedowns_landed_blue(self) -> np.ndarray:
        """
        Number of takedowns landed by fighter blue
        """
        return self.N[:, self.i_standing, self.i_takedown_landed_blue]

    @property
    def n_takedowns_landed_red(self) -> np.ndarray:
        """
        Number of takedowns landed by fighter red
        """
        return self.N[:, self.i_standing, self.i_takedown_landed_red]

    @property
    def n_reversals_landed_blue(self) -> np.ndarray:
        """
        Number of reversals landed by fighter blue
        """
        id = get_markov_id(abbreviation='RVL', fighter='blue')
        i  = self.r_nodes_idx[id]

        return self.N[:, self.i_standing, i]

    @property
    def n_reversals_landed_red(self) -> np.ndarray:
        """
        Number of reversals landed by fighter red
        """
        id = get_markov_id(abbreviation='RVL', fighter='red')
        i  = self.r_nodes_idx[id]

        return self.N[:, self.i_standing, i]

    @property
    def n_submission_attempts_blue(self) -> np.ndarray:
        """
        Number of submission attempts by fighter blue
        """
        return self.N[:, self.i_standing, self.i_submission_attempts_blue]

    @property
    def n_submission_attempts_red(self) -> np.ndarray:
        """
        Number of submission attempts by fighter red
        """
        return self.N[:, self.i_standing, self.i_submission_attempts_red]

    @property
    def t_ground_control_blue(self) -> np.ndarray:
        """
        Number of seconds spent in ground control by fighter blue
        """
        n = self.N[:, self.i_standing, self.i_ground_control_blue]

        return n * self.dt

    @property
    def t_ground_control_red(self) -> np.ndarray:
        """
        Number of seconds spent in ground control by fighter red
        """
        n = self.N[:, self.i_standing, self.i_ground_control_red]

        return n * self.dt

    @property
    def t_misc_control_blue(self) -> np.ndarray:
        """
        Number of seconds spent in miscellaneous control by fighter blue
        """
        n = self.N[:, self.i_standing, self.i_ground_control_blue]

        return n * self.dt

    @property
    def t_misc_control_red(self) -> np.ndarray:
        """
        Number of seconds spent in miscellaneous control by fighter red
        """
        n = self.N[:, self.i_standing, self.i_ground_control_red]

        return n * self.dt

    def n_delta(self, stat: str) -> np.ndarray:
        id_blue = get_markov_id(abbreviation=stat, fighter='blue')
        id_red  = get_markov_id(abbreviation=stat, fighter='red')

        i_blue = self.r_nodes_idx[id_blue]
        i_red  = self.r_nodes_idx[id_red]

        n_blue = self.N[:, self.i_standing, i_blue]
        n_red  = self.N[:, self.i_standing, i_red]

        return n_blue - n_red

    @property
    def p_strikes_landed_gt_blue(self) -> np.ndarray:
        """
        Probability that fighter blue has more strikes landed than fighter red in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_strikes_landed_blue,
            k=self.i_strikes_landed_red
        )

    @property
    def p_strikes_landed_gt_red(self) -> np.ndarray:
        """
        Probability that fighter red has more strikes landed than fighter blue in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_strikes_landed_red,
            k=self.i_strikes_landed_blue
        )

    @property
    def p_takedowns_landed_gt_blue(self) -> np.ndarray:
        """
        Probability that fighter blue has more takedowns landed than fighter red in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_takedown_landed_blue,
            k=self.i_takedown_landed_red
        )

    @property
    def p_takedowns_landed_gt_red(self) -> np.ndarray:
        """
        Probability that fighter red has more takedowns landed than fighter blue in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_takedown_landed_red,
            k=self.i_takedown_landed_blue
        )

    @property
    def p_submission_attempts_gt_blue(self) -> np.ndarray:
        """
        Probability that fighter blue has more submission attempts than fighter red in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_submission_attempts_blue,
            k=self.i_submission_attempts_red
        )

    @property
    def p_submission_attempts_gt_red(self) -> np.ndarray:
        """
        Probability that fighter red has more submission attempts than fighter blue in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_submission_attempts_blue,
            k=self.i_submission_attempts_red
        )

    @property
    def p_misc_control_gt_blue(self) -> np.ndarray:
        """
        Probability that fighter blue has more miscellaneous control than fighter red in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_misc_control_blue,
            k=self.i_misc_control_red
        )

    @property
    def p_misc_control_gt_red(self) -> np.ndarray:
        """
        Probability that fighter red has more miscellaneous control than fighter blue in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_misc_control_red,
            k=self.i_misc_control_blue
        )

    @property
    def p_ground_control_gt_blue(self) -> np.ndarray:
        """
        Probability that fighter blue has more ground control than fighter red in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_ground_control_blue,
            k=self.i_ground_control_red
        )

    @property
    def p_ground_control_gt_red(self) -> np.ndarray:
        """
        Probability that fighter red has more ground control than fighter blue in a single round
        """
        return self.p_Nj_gt_Nk(
            j=self.i_ground_control_red,
            k=self.i_ground_control_blue
        )

    def p_strikes_gt_x_blue(self, x: int) -> np.ndarray:
        """
        Probability that fighter blue has more than x strikes landed in a fight
        """
        return self.p_N(j=self.i_strikes_landed_blue, x=x)

    def p_strikes_gt_x_red(self, x: int) -> np.ndarray:
        """
        Probability that fighter red has more than x strikes landed in a fight
        """
        return self.p_N(j=self.i_strikes_landed_red, x=x)

    def p_takedowns_gt_x_blue(self, x: int) -> np.ndarray:
        """
        Probability that fighter blue has more than x takedowns landed in a fight
        """
        return self.p_N(j=self.i_takedown_landed_blue, x=x)

    def p_takedowns_gt_x_red(self, x: int) -> np.ndarray:
        """
        Probability that fighter red has more than x takedowns landed in a fight
        """
        return self.p_N(j=self.i_takedown_landed_red, x=x)

    def p_submission_attempts_gt_x_blue(self, x: int) -> np.ndarray:
        """
        Probability that fighter blue has more than x submission attempts in a fight
        """
        return self.p_N(j=self.i_submission_attempts_blue, x=x)

    def p_submission_attempts_gt_x_red(self, x: int) -> np.ndarray:
        """
        Probability that fighter red has more than x submission attempts in a fight
        """
        return self.p_N(j=self.i_submission_attempts_red, x=x)

    def p_misc_control_gt_x_blue(self, x: int) -> np.ndarray:
        """
        Probability that fighter blue has more than x miscellaneous control in a fight
        """
        return self.p_N(j=self.i_misc_control_blue, x=x)

    def p_misc_control_gt_x_red(self, x: int) -> np.ndarray:
        """
        Probability that fighter red has more than x miscellaneous control in a fight
        """
        return self.p_N(j=self.i_misc_control_red, x=x)

    def p_ground_control_gt_x_blue(self, x: int) -> np.ndarray:
        """
        Probability that fighter blue has more than xground control in a fight
        """
        return self.p_N(j=self.i_ground_control_blue, x=x)

    def p_ground_control_gt_x_red(self, x: int) -> np.ndarray:
        """
        Probability that fighter red has more ground control in a fight
        """
        return self.p_N(j=self.i_ground_control_blue, x=x)

    def p_surive_after_submission_attempts_blue(self) -> np.ndarray:
        """
        Probability that fighter blue goes to the distance after a submission attempt by fighter red
        """
        j = self.i_submission_attempts_red + A

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_red = self.h(j=j)
        p_win_red   = self.h(j=[self.i_knockout_red, self.i_submission_red], mu=mu)

        p_surv_blue = p_submission_attempts_red * (1 - np.cumsum(p_win_red, axis=2))

    def p_survive_after_submission_attempts_red(self) -> np.ndarray:
        """
        Probability that fighter red survives round after a submission attempt by fighter blue
        """
        j = self.i_submission_attempts_blue

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_blue = self.h(j=j)
        p_win_blue   = self.h(j=[self.i_knockout_blue, self.i_submission_blue], mu=mu)

        p_surv_red = p_submission_attempts_blue * (1 - np.cumsum(p_win_blue, axis=2))

    def p_survive_after_knockdown_blue(self) -> np.ndarray:
        """
        Probability that fighter blue survives round after a knockdown landed by fighter red
        """
        j = self.i_knockdown_red

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_red = self.h(j=j)
        p_win_red   = self.h(j=[self.i_knockout_red, self.i_submission_red], mu=mu)

        p_surv_blue = p_submission_attempts_red * (1 - np.cumsum(p_win_red, axis=2))

    def p_survive_after_knockdown_red(self) -> np.ndarray:
        """
        Probability that fighter red survives round after a knockdown landed by fighter blue
        """
        j = self.i_knockdown_blue

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_blue = self.h(j=j)
        p_win_blue   = self.h(j=[self.i_knockout_blue, self.i_submission_blue], mu=mu)

        p_surv_red = p_submission_attempts_blue * (1 - np.cumsum(p_win_blue, axis=2))

    def p_win_after_submission_attempts_blue(self) -> np.ndarray:
        """
        Probability that fighter blue wins within the round after a submission attempt by fighter red
        """
        j = self.i_submission_attempts_red

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_red = self.h(j=j)
        p_win_blue  = self.h(j=[self.i_knockout_blue, self.i_submission_blue], mu=mu)
        p_win_blue *= p_submission_attempts_red

        return p_submission_attempts_red * p_win_blue

    def p_win_after_submission_attempts_red(self) -> np.ndarray:
        """
        Probability that fighter red wins within the round after a submission attempt by fighter blue
        """
        j = self.i_submission_attempts_blue

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_blue = self.h(j=j)
        p_win_red    = self.h(j=[self.i_knockout_red, self.i_submission_red], mu=mu)
        p_win_red *= p_submission_attempts_blue

    def p_win_after_knockdown_blue(self) -> np.ndarray:
        """
        Probability that fighter blue wins within the round after a knockdown landed by fighter red
        """
        j = self.i_knockdown_red

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_red = self.h(j=j)
        p_win_blue  = self.h(j=[self.i_knockout_blue, self.i_submission_blue], mu=mu)
        p_win_blue *= p_submission_attempts_red

    def p_win_after_knockdown_red(self) -> np.ndarray:
        """
        Probability that fighter red survives round after a knockdown landed by fighter blue
        """
        j = self.i_knockdown_blue

        mu = np.zeros_like(self.mu)
        mu[:, j] = 1

        p_submission_attempts_blue = self.h(j=j)
        p_win_red    = self.h(j=[self.i_knockout_red, self.i_submission_red], mu=mu)
        p_win_red *= p_submission_attempts_blue

    def simulate_fight(self, n_simulations: int) -> np.ndarray:
        sims = np.hstack([
            self.simulate(x=n_simulations) for _ in range(self.n_rounds)
        ])

        A = np.isin(sims, self.nodes[self.i_absorbing])             # absorbed
        A = np.roll(A, 1)
        np.logical_or.accumulate(A, axis=1, out=A)

        i = np.where(~A, np.arange(A.shape[1]), 0)
        np.maximum.accumulate(i, axis=1, out=i)                     # add self-loops
        sims = sims[np.arange(i.shape[0])[:, None], i]

        return sims.reshape(self.n_rounds, n_simulations, -1)