# DataProcessor

Data pipeline specialist for transforming external data to database format.

## Usage

```
/data-processor validate <data or schema>
/data-processor transform <data type>
/data-processor enum <category>
/data-processor pipeline <review or design>
/data-processor logging <scenario>
/data-processor weekly              # Run weekly UFC data collection
```

## Agent Instructions

$import(.claude/agents/data-processor.md)

## Task

Maintain the data pipeline between external sources and the MMarkov database:

1. **Validate**: Define and enforce data validation rules
2. **Transform**: Convert raw external data to database-ready format
3. **Enum**: Define and use enums for categorical data
4. **Pipeline**: Design and review ETL pipeline logic
5. **Logging**: Implement comprehensive logging and error handling
6. **Weekly**: Run recurring "Weekly UFC data collection" (Linear task, every Monday)

Primary location: `/src/ufc/`

Prevents silent failures and missing data through robust error handling. Outputs include validation schemas, transformation code, and enum definitions.

### Weekly Task
Recurring Linear issue: **"Weekly UFC data collection"** - scrapes events, fights, fighters, validates data, runs ETL pipeline.
