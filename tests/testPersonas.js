/*
  Test the rules against a set of personas and return the result for each

  Command: yarn test
*/

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
			const warning = results[name] !== prodResults[name] ? '**' : ''
			console.log(
				`|${warning}${name}${warning}|${warning}${results[name]}${warning}|${warning}${prodResults[name]}${warning}|`
			)
		}
	})

console.log('| Nom | Total |')
console.log('|:-----|:------:|')
for (let name in results) {
	console.log(`|${name}|${results[name]}|`)
}
