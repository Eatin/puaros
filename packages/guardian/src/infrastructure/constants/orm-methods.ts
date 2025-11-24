export const ORM_QUERY_METHODS = [
    "findOne",
    "findMany",
    "findFirst",
    "findAll",
    "findAndCountAll",
    "insert",
    "insertMany",
    "insertOne",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "select",
    "query",
    "execute",
    "run",
    "exec",
    "aggregate",
    "count",
    "exists",
] as const

export type OrmQueryMethod = (typeof ORM_QUERY_METHODS)[number]
