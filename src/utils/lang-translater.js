/*!
 * Jodit Editor (https://xdsoft.net/jodit/)
 * Released under MIT see LICENSE.txt in the project root for license information.
 * Copyright (c) 2013-2020 Valeriy Chupurnov. All rights reserved. https://xdsoft.net
 */

const https = require('https');
const path = require('path');

const { argv } = require('yargs')
	.option('str', {
		type: 'string',
		required: true,
		description: 'Translate sentence'
	})
	.option('ytak', {
		type: 'string',
		required: true,
		description: 'Yandex Translate Api Key'
	})
	.option('dir', {
		type: 'string',
		default: path.resolve(process.cwd(), 'src/langs'),
		description: 'Directory'
	});

const yandex_translate_api_key = process.argv[2];

if (!yandex_translate_api_key) {
	throw new Error(
		'Need Yandex Translate API key. https://translate.yandex.com/developers/keys\n' +
			'You can run it file: node ./src/utils/lang-translater.js %api_key%'
	);
}

const translate = async (text, lang) => {
	return new Promise((resolve, reject) => {
		https
			.get(
				`https://translate.yandex.net/api/v1.5/tr.json/translate?` +
					`key=${yandex_translate_api_key}&text=${text}&lang=en-${lang}&format=plain`,
				res => {
					res.on('data', d => {
						const json = JSON.parse(d.toString());

						if (json.code !== 200) {
							return reject(lang + ':' + json.message);
						}

						return resolve(json.text[0]);
					});
				}
			)
			.on('error', e => {
				reject(e.message);
			});
	});
};

const fs = require('fs');

const folder = path.resolve(path.resolve(__dirname, '../langs'));
const files = fs.readdirSync(folder);

const replace = {
	cs_cz: 'cs',
	zh_cn: 'zh',
	zh_tw: 'th',
	pt_br: 'pt'
};

const translateAll = text => {
	files.forEach(async file => {
		const filename = path.join(folder, file);
		let lang = file.replace(/\.ts$/, '');

		if (['index', 'en'].includes(lang)) {
			return;
		}

		if (replace[lang]) {
			lang = replace[lang];
		}

		const data = fs.existsSync(filename)
			? fs.require(filename).default
			: {};
		data[text] = await translate(text, lang);
		fs.writeFileSync(
			filename,
			`${fs.readdirSync(
				'../header.js',
				'utf8'
			)}\nexport default ${JSON.stringify(data, null, '\t')};`
		);
	});
};

translateAll(argv.str);
