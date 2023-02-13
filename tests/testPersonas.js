/*
  Test the rules against a set of personas and return the result for each

  Command: yarn test
*/
require('isomorphic-fetch')

const Engine = require('publicodes').default

const rules = require('../public/co2-fr.json')
const personas = require('../public/personas-fr.json')

const personasRules = Object.values(personas)

const engine = new Engine(rules)
const missingVariables = Object.keys(engine.evaluate('bilan').missingVariables)

const results = {}

for (persona of personasRules) {
	const personaData = persona.data.situation || persona.data
	const validPersonaRules = Object.keys(personaData).filter((rule) =>
		missingVariables.includes(rule)
	)

	const validPersonaRulesObject = validPersonaRules.reduce(
		(acc, cur) => ({ ...acc, [cur]: personaData[cur] }),
		{}
	)
	engine.setSituation(validPersonaRulesObject)
	results[persona.nom] = engine.evaluate('bilan').nodeValue
}

fetch('https://data.nosgestesclimat.fr/co2-model.FR-lang.fr.json')
	.then((res) => res.json())
	.then((prodRules) => {
		prodEngine = new Engine(prodRules)
		const prodMissingVariables = Object.keys(
			prodEngine.evaluate('bilan').missingVariables
		)

		const prodResults = {}

		for (persona of personasRules) {
			const personaData = persona.data.situation || persona.data
			const validPersonaRules = Object.keys(personaData).filter((rule) =>
				prodMissingVariables.includes(rule)
			)

			const validPersonaRulesObject = validPersonaRules.reduce(
				(acc, cur) => ({ ...acc, [cur]: personaData[cur] }),
				{}
			)
			prodEngine.setSituation(validPersonaRulesObject)
			prodResults[persona.nom] = prodEngine.evaluate('bilan').nodeValue
		}
		console.log('| Nom | Total (PR) | Total (Prod) |')
		console.log('|:-----|:------:|:------:|')
		for (let name in results) {
			const different = results[name] !== prodResults[name]
			console.log(
				`|${different ? '⚠️' : '✅'} ${name}|${results[name]}|${
					prodResults[name]
				}|`
			)
		}
	})
/*
console.log('| Nom | Total |')
console.log('|:-----|:------:|')
for (let name in results) {
	console.log(`|${name}|${results[name]}|`)
}
*/
