var winston = module.parent.require('winston'),
    Meta = module.parent.require('./meta'),
    User = module.parent.require('./user'),
    Plugins = module.parent.require('./plugins'),
    Topics = module.parent.require('./topics'),
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

PostNotification.postSaved = function(postData) {
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

    var userID = postData.uid,
        content = postData.content,
        topicID = postData.tid,
        urlPrefix = Meta.config['postnotification:urlPrefix'],
        recipientList = Meta.config['postnotification:emails'],
        recipients = getEmails(recipientList);

    winston.log("[PostNotification] post saved");
    if ( ! recipients || recipients.length == 0) {
        winston.warn('[PostNotification] No recipients configured or invalid recipient list!');
        return;
    } 
    if ( ! Plugins.hasListeners('action:email.send')) {
        winston.warn('[PostNotification] No active email plugin found!');
        return;
    }    
    User.getUserData(userID, function(err, userData) {
        if (err) {
            winston.error('[PostNotification] Could not look up user data!');
            return;
        } 
        var username = userData.username;
        Topics.getTopicField(topicID, 'slug', function(err, slug) {
            if (err || ! slug || slug === topicID + '/') {
                winston.error('[PostNotification] Could not get topic slug!');
                return;
            }
            for (var i = 0; i != recipients.length; ++i) {
                var recipient = recipients[i];
                Plugins.fireHook('action:email.send', {
                    to: recipient,
                    from: Meta.config['email:from'] || 'no-reply@localhost.lan',
                    subject: "[Forum] Post saved",
                    html: '<p><a href="' + urlPrefix + '/topic/' + encodeURI(slug) + '">A post has been made or edited by <b>' + username + '</a>:</p>\n\n<p>' + content + '</p>',
                    plaintext: 'A post has been made or edited by <b>' + username + ' (' + urlPrefix + '/topic/' + encodeURI(slug) + '):\n\n' + content,
                    template: "post-notification"
                });
            }
        });
    });
}

module.exports = PostNotification;