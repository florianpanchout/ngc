/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const { exit } = require('process')
const { exec } = require('node:child_process')
const Engine = require('publicodes').default

const utils = require('./i18n/utils')
const cli = require('./i18n/cli')

const outputJSONPath = './public'

const {
	addTranslationToBaseRules,
} = require('./i18n/addTranslationToBaseRules')

const { constantFoldingFromJSONFile } = require('./modelOptim')

const { srcLang, srcFile, destLangs, markdown } = cli.getArgs(
	`Aggregates the model to an unique JSON file.`,

	{
		source: true,
		target: true,
		file: true,
		defaultSrcFile: 'data/**/*.yaml',
		markdown: true,
	}
)

function writeRules(rules, path, destLang) {
	try {
		fs.writeFileSync(path, JSON.stringify(rules))
		console.log(
			markdown
				? `| Rules compilation to JSON for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in: ${path}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules compilation to JSON for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while writting rules in:', path)
			console.log(err.message)
		}
		exit(-1)
	}
}

function compressRules(jsonPathWithoutExtension, destLang) {
	const destPath = `${jsonPathWithoutExtension}-opti.json`
	const err = constantFoldingFromJSONFile(
		jsonPathWithoutExtension + '.json',
		destPath,
		['**/translated-*.yaml']
	)

	if (err) {
		if (markdown) {
			console.log(
				`| Rules compression for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while compressing rules in:', destPath)
			console.log(err)
		}
		exit(-1)
	} else {
		console.log(
			markdown
				? `| Rules compression for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly compressed in: ${destPath}`
		)
	}
}

glob(srcFile, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
	const defaultDestPathWithoutExtension = path.join(
		outputJSONPath,
		`co2-${srcLang}`
	)
	const baseRules = files.reduce((acc, filename) => {
		try {
			const rules = utils.readYAML(path.resolve(filename))
			return { ...acc, ...rules }
		} catch (err) {
			console.log(
				' ❌ Une erreur est survenue lors de la lecture du fichier',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, {})

	try {
		new Engine(baseRules).evaluate('bilan')

		if (markdown) {
			console.log('| Task | Status | Message |')
			console.log('|:-----|:------:|:-------:|')
		}
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		writeRules(baseRules, defaultDestPathWithoutExtension + '.json', srcLang)
		compressRules(defaultDestPathWithoutExtension, srcLang)

		destLangs.forEach((destLang) => {
			const destPathWithoutExtension = path.join(
				outputJSONPath,
				`co2-${destLang}`
			)
			const destPath = destPathWithoutExtension + '.json'
			const translatedRuleAttrs =
				utils.readYAML(
					path.resolve(`data/translated-rules-${destLang}.yaml`)
				) ?? {}
			const translatedRules = addTranslationToBaseRules(
				baseRules,
				translatedRuleAttrs
			)
			writeRules(translatedRules, destPath, destLang)
			compressRules(destPathWithoutExtension, destLang)
		})
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
			console.log(err)
		} else {
			console.log(
				' ❌ Une erreur est survenue lors de la compilation des règles:\n'
			)
			let lines = err.message.split('\n')
			for (let i = 0; i < 9; ++i) {
				if (lines[i]) {
					console.log('  ', lines[i])
				}
			}
			console.log()
		}
	}
})
