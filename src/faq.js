var fs = require('fs')
let path = require('path');
var stringSimilarity = require('string-similarity');
const Discord = require('discord.js');

const sort_collator = new Intl.Collator(undefined, {numeric: true, sensitivity: 'base'});
const FAQ_timeouts = {}

const userdata_path = './../../benchbot_settings.json';

let FAQ = require(userdata_path).faq;

function saveSettings() {
    var root = {
        faq: FAQ
    }
    fs.writeFile(path.join(__dirname, userdata_path), JSON.stringify(root), function(err) {
        if (err) throw err;
    });
}


/**
 * Runs the FAQ command
 * @param {Discord.Message} msg 
 * @param {array} args 
 */
module.exports = function FAQCommand(msg, args) {
	if (msg.channel.type != 'DM' && msg.member && FAQ_timeouts[msg.member.id] && FAQ_timeouts[msg.member.id].count >= 2) {
		msg.reply({
			content: 'You can DM me to use more commands instead of using them here in the chat.\nThis helps to prevent filling random channels with bot messages and it gives you an easy way to read up on previous questions you asked me.',
			allowedMentions: {repliedUser: false}
		});
		clearTimeout(FAQ_timeouts[msg.member.id].timeout);
		delete FAQ_timeouts[msg.member.id];
		return;
	}

	function sanitizeKey(string) {
		return string.toLowerCase().replace(/[^a-z0-9._-]/g, '');
	}

	if (msg.channel.name === 'bot-commands' && args[1] == 'set') {

		var key = sanitizeKey(args[2]);
		var text = args.slice(3).join(' ');
		if (!text) {
			delete FAQ[key];
			msg.reply({content: `Removed the question '${key}'`, allowedMentions: {repliedUser: false}});
		} else {
			msg.reply({content: `${FAQ[key] ? 'Updated' : 'Added'} the question '${key}'`, allowedMentions: {repliedUser: false}});
			FAQ[key] = text;
		}
		saveSettings();

	} else if (msg.channel.name === 'bot-commands' && args[1] == 'remove') {

		var key = sanitizeKey(args[2]);
		if (FAQ[key]) {
			msg.reply({content: `Removed the question '${key}'`, allowedMentions: {repliedUser: false}});
			delete FAQ[key];
			saveSettings();
		} else {
			msg.reply({content: `Question not found`, allowedMentions: {repliedUser: false}});
		}

	} else if (msg.channel.name === 'bot-commands' && args[1] == 'rename') {

		var old_name = sanitizeKey(args[2]);
		var new_name = sanitizeKey(args[3]);
		if (FAQ[old_name] && new_name) {
			FAQ[new_name] = FAQ[old_name];
			delete FAQ[old_name];
			msg.reply({content: `Renamed the question '${old_name}' to '${new_name}'`, allowedMentions: {repliedUser: false}});
			saveSettings();
		} else if (!FAQ[old_name]) {
			msg.reply({content: `Question not found`, allowedMentions: {repliedUser: false}});
		} else {
			msg.reply({content: `Invalid number of arguments`, allowedMentions: {repliedUser: false}});
		}

	} else if (msg.channel.name === 'bot-commands' && args[1] == 'raw') {

		let key = sanitizeKey(args[2]);
		if (FAQ[key]) {
			msg.reply({content: '```\n'+FAQ[key].replace(/´/g, "\\`")+'\n```', allowedMentions: {repliedUser: false}});
		}

	} else if (args[1] == 'list' || args[1] == undefined) {
		let keys = Object.keys(FAQ).sort(sort_collator.compare)
		msg.reply({content: `Available questions: \`${keys.join(',  ')}\``, allowedMentions: {repliedUser: false}});

	} else if (args[1]) {
		args.shift();
		let key = sanitizeKey(args.join('-'));
		if (FAQ[key]) {
			msg.reply({content: `${FAQ[key]}`, allowedMentions: {repliedUser: false}});
		} else {
			var {bestMatch} = stringSimilarity.findBestMatch(key, Object.keys(FAQ));
			if (bestMatch && bestMatch.rating > 0.5) {
				msg.reply({content: `(Result for "${bestMatch.target}")\n${FAQ[bestMatch.target]}`, allowedMentions: {repliedUser: false}});
			} else {
				msg.reply({content: `Question '${key}' not found!`, allowedMentions: {repliedUser: false}});
			}
		}
	}
	if (msg.channel.name != 'bot-commands' && msg.member && !msg.member.roles.cache.find(role => role.name == 'Moderator') && msg.channel.type != 'DM') {
		if (FAQ_timeouts[msg.member.id]) {
			FAQ_timeouts[msg.member.id].count++;
		} else {
			FAQ_timeouts[msg.member.id] = {
				timeout: setTimeout(() => {
					delete FAQ_timeouts[msg.member.id];
				}, 1000*80),
				count: 1
			}
		}
	}
}