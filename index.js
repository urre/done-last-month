import Trello from 'node-trello'
import fs from 'fs'
import chalk from 'chalk'
import prompt from 'prompt'
import async from 'async'

require('dotenv').config()

const t = new Trello(process.env.TRELLO_KEY, process.env.TRELLO_TOKEN)
const d = new Date()
const f = './done.txt'

const log = console.log
let amount = 0
let trelloBoardName
let trelloBoardId
let trelloListId
let currentMonth
let cards = []

async.series([
	step => {
		prompt.start()
		prompt.get(
			[
				{
					name: 'board',
					required: true,
					description: 'Trello Board?'
				},
				{
					name: 'month',
					required: true,
					description: 'Month?'
				}
			],
			function(err, result) {
				trelloBoardName = result.board
				currentMonth = result.month
				step()
			}
		)
	},
	step => {
		t.get('/1/members/me/boards', function(err, data) {
			if (err) throw err

			for (let i of data) {
				if (i.name === trelloBoardName) {
					trelloBoardId = i.id
					step()
				}
			}
		})
	},
	step => {
		t.get(`/1/boards/${trelloBoardId}/lists/`, function(err, data) {
			for (let i of data) {
				if (i.name == 'Done') {
					trelloListId = i.id
					step()
				}
			}
		})
	},
	step => {
		t.get(`/1/lists/${trelloListId}/cards`, function(err, data) {
			if (err) throw err

			fs.truncate(f, 0, () => {})

			for (let i of data) {
				const cardMonth = i.dateLastActivity.substring(5, 7).replace(/^0+/, '')
				const card = `${i.dateLastActivity.substring(0, 10)} - ${i.name}`

				if (cardMonth == currentMonth) {
					amount++
					cards.push(card)
				}
			}
			step()
		})
	},
	step => {
		for (let i of cards) {
			fs.appendFile(f, `${i}\n`, err => {
				if (err) throw err
				step()
			})
		}
	},
	step => {
		log(chalk.green(`✅ Saved ${amount} Trello cards in done.txt!`))
		process.exit()
	}
])
