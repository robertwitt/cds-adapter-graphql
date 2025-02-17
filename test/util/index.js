const cds = require('@sap/cds/lib')
const path = require('path')
const prettier = require('prettier')
const { generateSchema4 } = require('../../lib/schema')
const { buildSchema, lexicographicSortSchema, printSchema, Kind } = require('graphql')

const SCHEMAS_DIR = path.join(__dirname, '../schemas')

const cdsFilesToGQLSchema = async files => {
  const m = cds.linked(await cds.load(files))
  const services = Object.fromEntries(m.services.map(s => [s.name, new cds.ApplicationService(s.name, m)]))
  return generateSchema4(services)
}

const formatSchema = schemaString =>
  prettier.format(printSchema(lexicographicSortSchema(buildSchema(schemaString))), { parser: 'graphql', printWidth: 0 })

/**
 * Create a fake/mock object that matches the structure of the info object that is passed to resolver functions by the graphql.js library.
 *
 * @param {Object} document - The parsed GraphQL query as returned by the graphql.js parse function.
 * @param {Object} [schema] - The GraphQL schema definition for the schema that the query adheres to.
 * @param {Object} [parentTypeName] - The name of the root type of the current query. Will most likely be 'Query' for queries and 'Mutation' for mutations.
 * @param {Object} [variables] - An object containing key/value pairs representing query variables and their values.
 * @returns {Object} Fake/mocked object that matches info object passed to resolvers.
 */
const fakeInfoObject = (document, schema, parentTypeName, variables) => {
  const operationDefinition = document.definitions.find(d => d.kind === Kind.OPERATION_DEFINITION)
  const fragments = Object.fromEntries(
    document.definitions.filter(d => d.kind === Kind.FRAGMENT_DEFINITION).map(f => [f.name.value, f])
  )
  return {
    fieldNodes: operationDefinition.selectionSet.selections,
    schema,
    parentType: schema._typeMap[parentTypeName],
    variableValues: { ...variables },
    fragments
  }
}

module.exports = { SCHEMAS_DIR, cdsFilesToGQLSchema, formatSchema, fakeInfoObject }
