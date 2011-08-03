#!/usr/bin/env node


/**
 * A quick partychat <-> IRC gateway
 * by harper@nata2.org
 *
 *
 * */

// Make sure the irc lib is available

var irc = require('irc');
var xmpp = require('node-xmpp');
var sys = require('sys');

/* 
*
* configure!
*
*
* */

try {
	var config = require('./config.json');
} catch (e) {
	console.error('ERROR - No configuration file found. Make a config.json');
	process.exit(1);
}
console.log(config.jid)


/* 
*
* instantiate the xmpp bot!
*
*  */

var xmpp_bot = new xmpp.Client({ jid: config.jid, password: config.jid_password});

/**
 *
 * instantiate the irc bot
 *
 * */

var irc_bot = new irc.Client(config.irc_server, config.irc_nick, {
    debug: true,
    channels: [config.irc_channel ],
});


/*
* XMPP portions
*
*
**/


xmpp_bot.on('online',
  function() {
    xmpp_bot.send(
      new xmpp.Element('presence', { }).
      c('show').t('chat').up().
      c('status').t('Partychat to IRC gateway. send messages back and forth')
    );
    irc_bot.say(config.irc_channel,'Logged into Jabber as '+ config.jid);
  });

xmpp_bot.on('stanza',
  function(stanza) {
    if (stanza.is('message') && stanza.attrs.type !== 'error'){
      var body = stanza.getChild('body').getText();
      console.log('<%s> %s', stanza.attrs.from, body);
      lines = body.match(/^.*((\r\n|\n|\r)|$)/gm);
      for (line in lines){
        irc_bot.say(config.irc_channel, lines[line]);
      }
    }
  });

xmpp_bot.on('error',
  function(e) {
    sys.puts(e);
  });


/* 
* IRC BOT!!
*
* */

irc_bot.addListener('error', function(message) {
    console.error('ERROR: %s: %s', message.command, message.args.join(' '));
});

irc_bot.addListener('message#blah', function (from, message) {
    console.log('<%s> %s', from, message);
});

irc_bot.addListener('message', function (from, to, message) {
    console.log('%s => %s: %s', from, to, message);
    body = '['+from+'] '+message;
    xmpp_bot.send(new xmpp.Element('message',{ to: config.target_jid,type: 'chat'}).c('body').t(body));
});

irc_bot.addListener('pm', function(nick, message) {
    console.log('Got private message from %s: %s', nick, message);
});
irc_bot.addListener('join', function(channel, who) {
    console.log('%s has joined %s', who, channel);
});
irc_bot.addListener('part', function(channel, who, reason) {
    console.log('%s has left %s: %s', who, channel, reason);
});
irc_bot.addListener('kick', function(channel, who, by, reason) {
    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
});
