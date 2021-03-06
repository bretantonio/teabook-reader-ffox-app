/*global window, Teavents, Blob, ReadiumSDK, readiumReady, $*/
"use strict";

var readiumReadyTest, isReadiumReady, handleMessage, openEpub, sendCurrentPageInfo, setFontSize, setTheme, themes, lastSpineHref, lastElementId;

themes = {
    author: {
        backgroundColor: '',
        color: ''
    },
    night: {
        backgroundColor: '#141414',
        color: '#d7d7d7'
    },
    grey: {
        backgroundColor: '#c4c4c4',
        color: '#292929'
    }
};

/**
 *
 * @param data
 */
openEpub = function (data) {
    var epubFile, openPageRequest;
    epubFile = new Blob([data.content], { "type": data.type });

    openPageRequest = false;
    if (data.chapter && data.chapter.length > 0) {
        openPageRequest = {
            contentRefUrl: data.chapter,
            sourceFileHref: "."
        };
    } else if (data.position) {
        openPageRequest = {
            idref: data.position.idref,
            elementCfi: data.position.contentCFI
        };
    }

    if (data.fontSize) {
        setFontSize(data.fontSize);
    }

    if (data.theme) {
        setTheme(data.theme);
    }

    window.readium.openPackageDocument(epubFile, function (packageDocument) {
        packageDocument.getTocText(function (toc) {
            window.parent.postMessage({ type: Teavents.TOC, data: toc }, "*");
            window.parent.postMessage({ type: Teavents.READY_TO_READ }, "*");
        });
    }, openPageRequest);
};

/**
 *
 * @param bookmark
 */
sendCurrentPageInfo = function (bookmark) {
    var bookmarkInfo = window.readium.reader.bookmarkCurrentPage();
    window.parent.postMessage({
        type: bookmark ? Teavents.PAGE_BOOKMARKED : Teavents.CURRENT_POSITION,
        data: JSON.parse(bookmarkInfo)
    }, "*");
};


/**
 *
 * @param size
 */
setFontSize = function (size) {
    window.readium.reader.updateSettings({
        fontSize: size
    });
};


/**
 *
 * @param theme
 */
setTheme = function (theme) {
    var bookStyle, bookStyles;
    bookStyle = themes[theme];
    if (bookStyle) {
        bookStyles = [{
            selector: 'body',
            declarations: {
                backgroundColor: bookStyle.backgroundColor,
                color: bookStyle.color
            }
        }];
        window.readium.reader.setBookStyles(bookStyles);
        $('#epub-reader-frame').css(bookStyles[0].declarations);
    }
};


/**
 * Handle postMessage communication
 *
 * @param event
 */
handleMessage = function (event) {
    if (event.data.action === Teavents.Actions.OPEN_CHAPTER) {
        window.readium.reader.openContentUrl(event.data.content);
    } else if (event.data.action === Teavents.Actions.OPEN_PAGE) {
        window.readium.reader.openPageIndex(event.data.content);
    } else if (event.data.action === Teavents.Actions.OPEN_POSITION) {
        window.readium.reader.openSpineItemElementCfi(event.data.content.idref, event.data.content.cfi, null);
    } else if (event.data.action === Teavents.Actions.SET_FONT_SIZE) {
        setFontSize(event.data.content);
    } else if (event.data.action === Teavents.Actions.SET_THEME) {
        setTheme(event.data.content);
    } else if (event.data.action === Teavents.Actions.OPEN_EPUB) {
        openEpub(event.data);
    } else if (event.data.action === Teavents.Actions.BOOKMARK_PAGE) {
        sendCurrentPageInfo(true);
    } else if (event.data.action === Teavents.Actions.GET_POSITION) {
        sendCurrentPageInfo();
    } else if (event.data.action === Teavents.Actions.NEXT_PAGE) {
        window.readium.reader.openPageRight();
    } else if (event.data.action === Teavents.Actions.PREV_PAGE) {
        window.readium.reader.openPageLeft();
    }
};

/**
 * Test if Readium is fully loaded
 */
isReadiumReady = function () {
    if (window.require !== undefined && window.readiumReady !== undefined) {
        clearInterval(readiumReadyTest);

        require(['Readium', 'gestures'], function (Readium, GesturesHandler) {
            var readerOptions, gesturesHandler;

            readerOptions = { el: '#epub-reader-frame' };
            window.readium = new Readium({ jsLibRoot: "" }, readerOptions, function (error) {
                console.error(error);
            });

            // setup gestures support with hammer
            gesturesHandler = new GesturesHandler(window.readium.reader, readerOptions.el);
            gesturesHandler.initialize();

            // transfer pagination info to the app
            window.readium.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function (pageChangeData) {
                var href = window.readium.reader.getLoadedSpineItems()[0].href,
                    elementId = pageChangeData.elementId;

                if (!elementId) {
                    if (lastSpineHref && href === lastSpineHref) {
                        elementId = lastElementId;
                    }
                } else {
                    lastElementId = elementId;
                }

                window.parent.postMessage({
                    type: ReadiumSDK.Events.PAGINATION_CHANGED,
                    data: {
                        pageInfo: pageChangeData.paginationInfo.openPages[0],
                        spineTotal: pageChangeData.paginationInfo.spineItemCount,
                        spineHref: href + (elementId ? "#" + elementId : "")
                    }
                }, "*");
                lastSpineHref = window.readium.reader.getLoadedSpineItems()[0].href;
            });

            // transfer updated settings
            window.readium.reader.on(ReadiumSDK.Events.SETTINGS_APPLIED, function () {
                window.parent.postMessage({
                    type: ReadiumSDK.Events.SETTINGS_APPLIED,
                    data: {
                        fontSize: window.readium.reader.viewerSettings().fontSize
                    }
                }, "*");
            });

            // transfer pinch move scale events
            window.readium.reader.on(ReadiumSDK.Events.GESTURE_PINCH_MOVE, function (scale) {
                window.parent.postMessage({
                    type: ReadiumSDK.Events.GESTURE_PINCH_MOVE,
                    data: scale
                }, "*");
            });

            // transfer tap events
            window.readium.reader.on(ReadiumSDK.Events.GESTURE_TAP, function (center) {
                window.parent.postMessage({
                    type: ReadiumSDK.Events.GESTURE_TAP,
                    data: center
                }, "*");
            });

            // transfer selected Readium events to the app
            [
                ReadiumSDK.Events.CONTENT_DOCUMENT_LOAD_START,
                ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED,
                ReadiumSDK.Events.GESTURE_PINCH
            ].forEach(function (event) {
                window.readium.reader.on(event, function () {
                    window.parent.postMessage({
                        type: event
                    }, "*");
                });
            });

            // request epub data
            window.parent.postMessage({ type: Teavents.EPUB_SEND }, "*");
        });
    }
};


// Wait for Readium and postMessage communication
readiumReadyTest = setInterval(isReadiumReady, 100);
window.addEventListener("message", handleMessage, false);