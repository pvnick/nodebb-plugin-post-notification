var path = require('path'),
    winston = module.parent.require('winston'),
    nconf = module.parent.require('nconf'),
    Meta = module.parent.require('./meta'),
    User = module.parent.require('./user'),
    Plugins = module.parent.require('./plugins'),
    PostNotification = {};

PostNotification.init = function(args,callback) {
  var app = args.router,
  middleware = args.middleware,
  controllers = args.controllers;
    function renderAdminPage(req, res, next) {
        res.render('admin/post-notification/config', {});
    }

    app.get('/admin/post-notification/config', middleware.admin.buildHeader,[], renderAdminPage);
    app.get('/api/admin/post-notification/config', renderAdminPage);


    callback();
};

PostNotification.admin = {
    menu: function(custom_header, callback) {
        custom_header.plugins.push({
            "route": '/post-notification/config',
            "icon": 'fa-envelope-o',
            "name": 'Post Notification'
        });

        callback(null, custom_header);
    }
};

function getEmails(commaSeparatedList) {
    if (typeof(commaSeparatedList) != "string")
        return null;
    var emailListSplit = commaSeparatedList.split(","),
        emails = [];
        validEmailRE = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    for (var i = 0; i != emailListSplit.length; ++i) {
        var email = emailListSplit[i].trim();
        if ( ! validEmailRE.test(email)) 
            return null;
        emails.push(email);
    }
    return emails;
}

PostNotification.postSaved = function(postData) {
    var userID = postData.uid,
        content = postData.content,
        topicID = postData.tid,
        recipientList = Meta.config['postnotification:emails'],
        recipients = getEmails(recipientList);
    winston.log("[PostNotification] post saved");
    if ( ! recipients || recipients.length == 0) {
        winston.warn('[PostNotification] No recipients configured or invalid recipient list!');
    } else {
        User.getUserData(userID, function(err, userData) {
            var username = userData.username;
            if (Plugins.hasListeners('action:email.send')) {
                for (var i = 0; i != recipients.length; ++i) {
                    var recipient = recipients[i].trim();
                    Plugins.fireHook('action:email.send', {
                        to: recipient,
                        from: Meta.config['email:from'] || 'no-reply@localhost.lan',
                        subject: "[Forum] Post saved",
                        html: '<p><a href="' + nconf.get('url') + '/topic/' + topicID + '/">A post has been made or edited by <b>' + username + '</a>:</p>\n\n<p>' + content + '</p>',
                        plaintext: 'A post has been made or edited by <b>' + username + ' (' + nconf.get('url') + '/topic/' + topicID + '/):\n\n' + content,
                        template: "post-notification"
                    });
                }
            } else {
                winston.warn('[emailer] No active email plugin found!');
            }
        });
    }
}

module.exports = PostNotification;