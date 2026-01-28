# DatabaseEngineer

PostgreSQL specialist for database design, optimization, and maintenance.

## Usage

```
/database-engineer design <table or schema>
/database-engineer review <sql file or table>
/database-engineer optimize <query or table>
/database-engineer backup <strategy question>
/database-engineer migrate <migration task>
```

## Agent Instructions

$import(.claude/agents/database-engineer.md)

## Task

Provide expert guidance on PostgreSQL database management:

1. **Design**: Schema design with proper constraints, data types, and relationships
2. **Review**: Audit tables for constraints, indexes, and best practices
3. **Optimize**: Query optimization, index strategies, connection pooling
4. **Backup**: Backup strategies, retention policies, restore procedures
5. **Migrate**: Schema evolution, migration scripts, version management

Works closely with BackendArchitect on API-database integration. Outputs include SQL schemas, migration scripts, and configuration recommendations.
