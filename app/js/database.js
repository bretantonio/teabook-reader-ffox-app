/*global define*/
define('database', function () {
    "use strict";

    return {
        id: "teareader",
        migrations: [
            {
                version: 1,
                migrate: function (transaction, next) {
                    var ebooks = transaction.db.createObjectStore("ebooks", { keyPath: 'hash' });
                    ebooks.createIndex("title", "title");
                    ebooks.createIndex("hash", "hash", { unique: true });
                    next();
                }
            },
            {
                version: 2,
                migrate: function (transaction, next) {
                    var bookmarks = transaction.db.createObjectStore("bookmarks", { keyPath: 'id', autoIncrement: true });
                    bookmarks.createIndex("hash", "hash");
                    bookmarks.createIndex("hash, cfi", ["hash", "cfi"], { unique: true });
                    next();
                }
            }
        ]
    };
});