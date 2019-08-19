// koffee 1.3.0

/*
00     00   0000000   000  000   000
000   000  000   000  000  0000  000
000000000  000000000  000  000 0 000
000 0 000  000   000  000  000  0000
000   000  000   000  000  000   000
 */
var BrowserWindow, Menu, Tray, _, about, activateApp, activeApp, activeWin, allKeys, app, appName, apps, args, childp, clipboard, createWindow, electron, findApps, fs, getActiveApp, iconDir, karg, klog, kstr, onWinResize, os, pkg, post, prefs, ref, reloadWindow, saveBounds, scripts, showAbout, slash, squareTimer, srcmap, toggleWindow, tray, valid, walkdir, win;

ref = require('kxk'), post = ref.post, srcmap = ref.srcmap, walkdir = ref.walkdir, about = ref.about, args = ref.args, childp = ref.childp, prefs = ref.prefs, karg = ref.karg, valid = ref.valid, slash = ref.slash, kstr = ref.kstr, klog = ref.klog, os = ref.os, fs = ref.fs, _ = ref._;

pkg = require('../package.json');

electron = require('electron');

app = electron.app;

BrowserWindow = electron.BrowserWindow;

Tray = electron.Tray;

Menu = electron.Menu;

clipboard = electron.clipboard;

iconDir = slash.resolve((app.getPath('userData')) + "/icons");

win = null;

tray = null;

apps = {};

scripts = {};

allKeys = [];

process.on('uncaughtException', function(err) {
    srcmap.logErr(err, '🔻');
    return true;
});

klog.slog.icon = slash.fileUrl(slash.resolve(slash.join(__dirname, '..', 'img', 'menu@2x.png')));

app.setName(pkg.productName);

args = args.init("verbose     log verbose     false\ndebug       log debug       false  -D");

post.on('winlog', function(text) {
    return console.log(">>> " + text);
});

post.on('runScript', function(name) {
    return scripts[name].cb();
});

post.on('cancel', function() {
    return activateApp();
});

post.on('about', function() {
    return showAbout();
});

post.on('findApps', function() {
    return findApps();
});

post.onGet('apps', function() {
    return {
        apps: apps,
        scripts: scripts,
        allKeys: allKeys
    };
});

findApps = function() {
    var appFind, exeFind, sortKeys;
    sortKeys = function() {
        var hideWin;
        allKeys = Object.keys(apps).concat(Object.keys(scripts));
        allKeys.sort(function(a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
        if (win) {
            return post.toWins('appsFound');
        } else {
            createWindow();
            hideWin = function() {
                return win != null ? win.hide() : void 0;
            };
            if (!args.debug) {
                return setTimeout(hideWin, 1000);
            }
        }
    };
    if (slash.win()) {
        exeFind = require('./exefind');
        return exeFind(function(exes) {
            if (valid(exes)) {
                apps = exes;
                return sortKeys();
            }
        });
    } else {
        appFind = require('./appfind');
        return appFind(function(appl) {
            apps = appl;
            return sortKeys();
        });
    }
};

appName = null;

activeApp = null;

activeWin = null;

getActiveApp = function() {
    var top, wxw;
    if (slash.win()) {
        wxw = require('wxw');
        top = wxw('info', 'top')[0];
        if ((top != null ? top.path : void 0) != null) {
            appName = activeApp = slash.base(top.path);
        }
    } else {
        activeApp = childp.execSync(__dirname + "/../bin/appswitch -P");
    }
    if (args.verbose) {
        console.log('getActiveApp', appName, activeApp, win != null);
    }
    if (win != null) {
        if (appName != null) {
            if (args.verbose) {
                console.log('getActiveApp currentApp', appName);
            }
            post.toWins('currentApp', appName);
        } else {
            if (args.verbose) {
                console.log('getActiveApp clearSearch', appName);
            }
            post.toWins('clearSearch');
        }
        if (args.verbose) {
            console.log('getActiveApp fade');
        }
        return post.toWins('fade');
    } else {
        return createWindow();
    }
};

activateApp = function() {
    var info, wxw;
    if (slash.win()) {
        if (activeWin) {
            wxw = require('wxw');
            info = wxw('info', activeWin)[0];
            if (info != null ? info.path : void 0) {
                klog('activate', info.path);
                wxw('launch', info.path);
            }
        }
        return win != null ? win.hide() : void 0;
    } else {
        if (activeApp == null) {
            return win != null ? win.hide() : void 0;
        } else {
            return childp.exec(__dirname + "/../bin/appswitch -fp " + activeApp, function(err) {
                return win != null ? win.hide() : void 0;
            });
        }
    }
};

toggleWindow = function() {
    var osascript;
    if (win != null ? win.isVisible() : void 0) {
        if (prefs.get('hideOnDoubleActivation', false)) {
            return win.hide();
        } else {
            post.toWins('openCurrent');
            if (!slash.win()) {
                return activateApp();
            }
        }
    } else {
        if (slash.win()) {
            if (win == null) {
                return createWindow();
            } else {
                getActiveApp();
                return win.focus();
            }
        } else {
            osascript = require('osascript')["eval"];
            return osascript("tell application \"System Events\"\n    set n to name of first application process whose frontmost is true\nend tell\ndo shell script \"echo \" & n", {
                type: 'AppleScript'
            }, function(err, name) {
                appName = String(name).trim();
                if (win == null) {
                    return createWindow();
                } else {
                    getActiveApp();
                    return win.focus();
                }
            });
        }
    }
};

reloadWindow = function() {
    return win.webContents.reloadIgnoringCache();
};

createWindow = function() {
    var bounds;
    if (win != null) {
        return;
    }
    win = new BrowserWindow({
        width: 300,
        height: 300,
        center: true,
        alwaysOnTop: true,
        movable: true,
        resizable: true,
        transparent: true,
        frame: false,
        maximizable: false,
        minimizable: false,
        minWidth: 200,
        minHeight: 200,
        maxWidth: 600,
        maxHeight: 600,
        fullscreen: false,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });
    bounds = prefs.get('bounds');
    if (bounds != null) {
        win.setBounds(bounds);
    }
    win.loadURL("file://" + __dirname + "/index.html");
    win.on('closed', function() {
        return win = null;
    });
    win.on('resize', onWinResize);
    win.on('move', saveBounds);
    win.on('ready-to-show', function() {
        getActiveApp();
        if (args.debug) {
            win.show();
            return win.webContents.openDevTools();
        }
    });
    return win;
};

saveBounds = function() {
    if (win != null) {
        return prefs.set('bounds', win.getBounds());
    }
};

squareTimer = null;

onWinResize = function(event) {
    var adjustSize;
    clearTimeout(squareTimer);
    adjustSize = function() {
        var b;
        b = win.getBounds();
        if (b.width !== b.height) {
            b.width = b.height = Math.min(b.width, b.height);
            win.setBounds(b);
        }
        return saveBounds();
    };
    return squareTimer = setTimeout(adjustSize, 300);
};

showAbout = function() {
    var color, highl, textc;
    if (prefs.get('scheme', 'bright') === 'bright') {
        color = '#fff';
        textc = '#ddd';
        highl = '#000';
    } else {
        textc = '#444';
        highl = '#fff';
        color = '#111';
    }
    return about({
        img: __dirname + "/../img/about.png",
        color: textc,
        highlight: highl,
        background: color,
        size: 200,
        pkg: pkg
    });
};

app.on('window-all-closed', function(event) {
    return event.preventDefault();
});

app.on('ready', function() {
    var ref1, scr;
    if (app.requestSingleInstanceLock != null) {
        if (app.requestSingleInstanceLock()) {
            app.on('second-instance', toggleWindow);
        } else {
            app.exit(0);
        }
    }
    tray = new Tray(__dirname + "/../img/menu.png");
    tray.on('click', toggleWindow);
    if (os.platform() !== 'darwin') {
        tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: "Quit",
                click: function() {
                    app.exit(0);
                    return process.exit(0);
                }
            }, {
                label: "About",
                click: showAbout
            }, {
                label: "Activate",
                click: toggleWindow
            }
        ]));
    }
    if ((ref1 = app.dock) != null) {
        ref1.hide();
    }
    Menu.setApplicationMenu(Menu.buildFromTemplate([
        {
            label: app.getName(),
            submenu: [
                {
                    label: "About " + pkg.name,
                    accelerator: 'CmdOrCtrl+.',
                    click: function() {
                        return showAbout();
                    }
                }, {
                    type: 'separator'
                }, {
                    label: 'Quit',
                    accelerator: 'CmdOrCtrl+Q',
                    click: function() {
                        saveBounds();
                        app.exit(0);
                        return process.exit(0);
                    }
                }
            ]
        }, {
            label: 'Window',
            submenu: [
                {
                    label: 'Close Window',
                    accelerator: 'CmdOrCtrl+W',
                    click: function() {
                        return win != null ? win.close() : void 0;
                    }
                }, {
                    type: 'separator'
                }, {
                    label: 'Reload Window',
                    accelerator: 'CmdOrCtrl+Alt+L',
                    click: function() {
                        return reloadWindow();
                    }
                }, {
                    label: 'Toggle DevTools',
                    accelerator: 'CmdOrCtrl+Alt+I',
                    click: function() {
                        return win != null ? win.webContents.openDevTools() : void 0;
                    }
                }
            ]
        }
    ]));
    prefs.init({
        defaults: {
            shortcut: 'F1'
        }
    });
    electron.globalShortcut.register(prefs.get('shortcut'), toggleWindow);
    fs.ensureDirSync(iconDir);
    scr = require('./scripts');
    if (slash.win()) {
        scripts = scr.winScripts();
    } else {
        scripts = scr.macScripts();
    }
    return findApps();
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIuIiwic291cmNlcyI6WyIiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7OztBQUFBLElBQUE7O0FBUUEsTUFBbUcsT0FBQSxDQUFRLEtBQVIsQ0FBbkcsRUFBRSxlQUFGLEVBQVEsbUJBQVIsRUFBZ0IscUJBQWhCLEVBQXlCLGlCQUF6QixFQUFnQyxlQUFoQyxFQUFzQyxtQkFBdEMsRUFBOEMsaUJBQTlDLEVBQXFELGVBQXJELEVBQTJELGlCQUEzRCxFQUFrRSxpQkFBbEUsRUFBeUUsZUFBekUsRUFBK0UsZUFBL0UsRUFBcUYsV0FBckYsRUFBeUYsV0FBekYsRUFBNkY7O0FBRTdGLEdBQUEsR0FBZ0IsT0FBQSxDQUFRLGlCQUFSOztBQUNoQixRQUFBLEdBQWdCLE9BQUEsQ0FBUSxVQUFSOztBQUVoQixHQUFBLEdBQWdCLFFBQVEsQ0FBQzs7QUFDekIsYUFBQSxHQUFnQixRQUFRLENBQUM7O0FBQ3pCLElBQUEsR0FBZ0IsUUFBUSxDQUFDOztBQUN6QixJQUFBLEdBQWdCLFFBQVEsQ0FBQzs7QUFDekIsU0FBQSxHQUFnQixRQUFRLENBQUM7O0FBQ3pCLE9BQUEsR0FBZ0IsS0FBSyxDQUFDLE9BQU4sQ0FBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBSixDQUFZLFVBQVosQ0FBRCxDQUFBLEdBQXlCLFFBQXpDOztBQUVoQixHQUFBLEdBQWdCOztBQUNoQixJQUFBLEdBQWdCOztBQUVoQixJQUFBLEdBQWdCOztBQUNoQixPQUFBLEdBQWdCOztBQUNoQixPQUFBLEdBQWdCOztBQUVoQixPQUFPLENBQUMsRUFBUixDQUFXLG1CQUFYLEVBQStCLFNBQUMsR0FBRDtJQUMzQixNQUFNLENBQUMsTUFBUCxDQUFjLEdBQWQsRUFBbUIsSUFBbkI7V0FDQTtBQUYyQixDQUEvQjs7QUFJQSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQVYsR0FBaUIsS0FBSyxDQUFDLE9BQU4sQ0FBYyxLQUFLLENBQUMsT0FBTixDQUFjLEtBQUssQ0FB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RCxZQUF4RDtJQUVBLEVBQUUsQ0FBQyxhQUFILENBQWlCLE9BQWpCO0lBRUEsR0FBQSxHQUFNLE9BQUEsQ0FBUSxXQUFSO0lBQ04sSUFBRyxLQUFLLENBQUMsR0FBTixDQUFBLENBQUg7UUFDSSxPQUFBLEdBQVUsR0FBRyxDQUFDLFVBQUosQ0FBQSxFQURkO0tBQUEsTUFBQTtRQUdJLE9BQUEsR0FBVSxHQUFHLENBQUMsVUFBSixDQUFBLEVBSGQ7O1dBS0EsUUFBQSxDQUFBO0FBckZXLENBQWYiLCJzb3VyY2VzQ29udGVudCI6WyIjIyNcbjAwICAgICAwMCAgIDAwMDAwMDAgICAwMDAgIDAwMCAgIDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwMCAgMDAwXG4wMDAwMDAwMDAgIDAwMDAwMDAwMCAgMDAwICAwMDAgMCAwMDBcbjAwMCAwIDAwMCAgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMFxuMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgMDAwICAgMDAwXG4jIyNcblxueyBwb3N0LCBzcmNtYXAsIHdhbGtkaXIsIGFib3V0LCBhcmdzLCBjaGlsZHAsIHByZWZzLCBrYXJnLCB2YWxpZCwgc2xhc2gsIGtzdHIsIGtsb2csIG9zLCBmcywgXyB9ID0gcmVxdWlyZSAna3hrJ1xuXG5wa2cgICAgICAgICAgID0gcmVxdWlyZSAnLi4vcGFja2FnZS5qc29uJ1xuZWxlY3Ryb24gICAgICA9IHJlcXVpcmUgJ2VsZWN0cm9uJ1xuXG5hcHAgICAgICAgICAgID0gZWxlY3Ryb24uYXBwXG5Ccm93c2VyV2luZG93ID0gZWxlY3Ryb24uQnJvd3NlcldpbmRvd1xuVHJheSAgICAgICAgICA9IGVsZWN0cm9uLlRyYXlcbk1lbnUgICAgICAgICAgPSBlbGVjdHJvbi5NZW51XG5jbGlwYm9hcmQgICAgID0gZWxlY3Ryb24uY2xpcGJvYXJkXG5pY29uRGlyICAgICAgID0gc2xhc2gucmVzb2x2ZSBcIiN7YXBwLmdldFBhdGgoJ3VzZXJEYXRhJyl9L2ljb25zXCJcblxud2luICAgICAgICAgICA9IG51bGxcbnRyYXkgICAgICAgICAgPSBudWxsXG5cbmFwcHMgICAgICAgICAgPSB7fVxuc2NyaXB0cyAgICAgICA9IHt9XG5hbGxLZXlzICAgICAgID0gW11cblxucHJvY2Vzcy5vbiAndW5jYXVnaHRFeGNlcHRpb24nIChlcnIpIC0+XG4gICAgc3JjbWFwLmxvZ0VyciBlcnIsICfwn5S7J1xuICAgIHRydWVcblxua2xvZy5zbG9nLmljb24gPSBzbGFzaC5maWxlVXJsIHNsYXNoLnJlc29sdmUgc2xhc2guam9pbiBfX2Rpcm5hbWUsICcuLicgJ2ltZycgJ21lbnVAMngucG5nJ1xuXG5hcHAuc2V0TmFtZSBwa2cucHJvZHVjdE5hbWVcblxuYXJncyA9IGFyZ3MuaW5pdCBcIlwiXCJcbiAgICB2ZXJib3NlICAgICBsb2cgdmVyYm9zZSAgICAgZmFsc2VcbiAgICBkZWJ1ZyAgICAgICBsb2cgZGVidWcgICAgICAgZmFsc2UgIC1EXG5cIlwiXCJcblxuIyAwMDAwMDAwMCAgICAwMDAwMDAwICAgIDAwMDAwMDAgIDAwMDAwMDAwMFxuIyAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAgIDAwMCAgIFxuIyAwMDAwMDAwMCAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgIDAwMCAgIFxuIyAwMDAgICAgICAgIDAwMCAgIDAwMCAgICAgICAwMDAgICAgIDAwMCAgIFxuIyAwMDAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMCAgICAgIDAwMCAgIFxuXG5wb3N0Lm9uICd3aW5sb2cnICAgICh0ZXh0KSAtPiBsb2cgXCI+Pj4gXCIgKyB0ZXh0XG5wb3N0Lm9uICdydW5TY3JpcHQnIChuYW1lKSAtPiBzY3JpcHRzW25hbWVdLmNiKClcbnBvc3Qub24gJ2NhbmNlbCcgICAtPiBhY3RpdmF0ZUFwcCgpXG5wb3N0Lm9uICdhYm91dCcgICAgLT4gc2hvd0Fib3V0KClcbnBvc3Qub24gJ2ZpbmRBcHBzJyAtPiBmaW5kQXBwcygpXG5cbnBvc3Qub25HZXQgJ2FwcHMnIC0+IGFwcHM6IGFwcHMsIHNjcmlwdHM6c2NyaXB0cywgYWxsS2V5czphbGxLZXlzXG5cbiMgMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgICAwMDAwMDAwICAgMDAwMDAwMDAgICAwMDAwMDAwMCAgICAwMDAwMDAwICBcbiMgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgICAgICBcbiMgMDAwMDAwICAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgICAgICAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICBcbiMgMDAwICAgICAgIDAwMCAgMDAwICAwMDAwICAwMDAgICAwMDAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgICAgICAgMDAwICBcbiMgMDAwICAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAwMDAwICAgICAgICAgIDAwMCAgIDAwMCAgMDAwICAgICAgICAwMDAgICAgICAgIDAwMDAwMDAgICBcblxuZmluZEFwcHMgPSAtPlxuXG4gICAgc29ydEtleXMgPSAtPlxuXG4gICAgICAgIGFsbEtleXMgPSBPYmplY3Qua2V5cyhhcHBzKS5jb25jYXQgT2JqZWN0LmtleXMoc2NyaXB0cylcbiAgICAgICAgYWxsS2V5cy5zb3J0IChhLGIpIC0+IGEudG9Mb3dlckNhc2UoKS5sb2NhbGVDb21wYXJlIGIudG9Mb3dlckNhc2UoKVxuICAgICAgICBcbiAgICAgICAgaWYgd2luXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnYXBwc0ZvdW5kJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgaGlkZVdpbiA9IC0+IHdpbj8uaGlkZSgpXG4gICAgICAgICAgICBpZiBub3QgYXJncy5kZWJ1Z1xuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQgaGlkZVdpbiwgMTAwMFxuICAgIFxuICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgIGV4ZUZpbmQgPSByZXF1aXJlICcuL2V4ZWZpbmQnXG4gICAgICAgIGV4ZUZpbmQgKGV4ZXMpIC0+IFxuICAgICAgICAgICAgaWYgdmFsaWQgZXhlc1xuICAgICAgICAgICAgICAgIGFwcHMgPSBleGVzXG4gICAgICAgICAgICAgICAgc29ydEtleXMoKVxuICAgIGVsc2VcbiAgICAgICAgYXBwRmluZCA9IHJlcXVpcmUgJy4vYXBwZmluZCdcbiAgICAgICAgYXBwRmluZCAoYXBwbCkgLT4gXG4gICAgICAgICAgICBhcHBzID0gYXBwbFxuICAgICAgICAgICAgc29ydEtleXMoKVxuICAgICAgICAgICAgXG4jIDAwMDAwMDAgICAgMDAwMDAwMCAgMDAwMDAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDBcbiMwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDBcbiMwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwXG4jMDAwICAgMDAwICAwMDAgICAgICAgICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgMDAwXG4jMDAwICAgMDAwICAgMDAwMDAwMCAgICAgMDAwICAgICAwMDAgICAgICAwICAgICAgMDAwMDAwMDBcblxuYXBwTmFtZSAgID0gbnVsbFxuYWN0aXZlQXBwID0gbnVsbFxuYWN0aXZlV2luID0gbnVsbFxuXG5nZXRBY3RpdmVBcHAgPSAtPlxuXG4gICAgaWYgc2xhc2gud2luKClcbiAgICAgICAgd3h3ID0gcmVxdWlyZSAnd3h3J1xuICAgICAgICB0b3AgPSB3eHcoJ2luZm8nICd0b3AnKVswXVxuICAgICAgICBpZiB0b3A/LnBhdGg/XG4gICAgICAgICAgICBhcHBOYW1lID0gYWN0aXZlQXBwID0gc2xhc2guYmFzZSB0b3AucGF0aFxuICAgIGVsc2VcbiAgICAgICAgYWN0aXZlQXBwID0gY2hpbGRwLmV4ZWNTeW5jIFwiI3tfX2Rpcm5hbWV9Ly4uL2Jpbi9hcHBzd2l0Y2ggLVBcIlxuXG4gICAgbG9nICdnZXRBY3RpdmVBcHAnLCBhcHBOYW1lLCBhY3RpdmVBcHAsIHdpbj8gaWYgYXJncy52ZXJib3NlXG4gICAgICAgIFxuICAgIGlmIHdpbj9cbiAgICAgICAgaWYgYXBwTmFtZT9cbiAgICAgICAgICAgIGxvZyAnZ2V0QWN0aXZlQXBwIGN1cnJlbnRBcHAnIGFwcE5hbWUgaWYgYXJncy52ZXJib3NlXG4gICAgICAgICAgICBwb3N0LnRvV2lucyAnY3VycmVudEFwcCcgYXBwTmFtZVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBsb2cgJ2dldEFjdGl2ZUFwcCBjbGVhclNlYXJjaCcgYXBwTmFtZSBpZiBhcmdzLnZlcmJvc2VcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdjbGVhclNlYXJjaCdcbiAgICAgICAgbG9nICdnZXRBY3RpdmVBcHAgZmFkZScgaWYgYXJncy52ZXJib3NlXG4gICAgICAgIHBvc3QudG9XaW5zICdmYWRlJ1xuICAgIGVsc2VcbiAgICAgICAgY3JlYXRlV2luZG93KClcblxuIyAgMDAwMDAwMCAgICAwMDAwMDAwICAwMDAwMDAwMDAgIDAwMCAgMDAwICAgMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAwMDAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgIDAwMCAwMDAgICAwMDAwMDAwMDAgICAgIDAwMCAgICAgMDAwMDAwMCAgIFxuIyAwMDAgICAwMDAgIDAwMCAgICAgICAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAwMDAgICAwMDAgICAwMDAwMDAwICAgICAwMDAgICAgIDAwMCAgICAgIDAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwMDAwMDAgIFxuXG5hY3RpdmF0ZUFwcCA9IC0+XG5cbiAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICBpZiBhY3RpdmVXaW5cbiAgICAgICAgICAgIHd4dyA9IHJlcXVpcmUgJ3d4dydcbiAgICAgICAgICAgIGluZm8gPSB3eHcoJ2luZm8nIGFjdGl2ZVdpbilbMF1cbiAgICAgICAgICAgIGlmIGluZm8/LnBhdGhcbiAgICAgICAgICAgICAgICBrbG9nICdhY3RpdmF0ZScgaW5mby5wYXRoXG4gICAgICAgICAgICAgICAgd3h3ICdsYXVuY2gnIGluZm8ucGF0aFxuICAgICAgICAgICAgICAgICMgd3h3ICdyYWlzZScgaW5mby5wYXRoXG4gICAgICAgICAgICAgICAgIyB3eHcgJ2ZvY3VzJyBpbmZvLnBhdGhcbiAgICAgICAgd2luPy5oaWRlKClcbiAgICBlbHNlXG5cbiAgICAgICAgaWYgbm90IGFjdGl2ZUFwcD9cbiAgICAgICAgICAgIHdpbj8uaGlkZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNoaWxkcC5leGVjIFwiI3tfX2Rpcm5hbWV9Ly4uL2Jpbi9hcHBzd2l0Y2ggLWZwICN7YWN0aXZlQXBwfVwiLCAoZXJyKSAtPiB3aW4/LmhpZGUoKVxuXG4jMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuIzAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiMwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4jMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuIzAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcblxudG9nZ2xlV2luZG93ID0gLT5cbiAgICBcbiAgICBpZiB3aW4/LmlzVmlzaWJsZSgpXG4gICAgICAgIGlmIHByZWZzLmdldCAnaGlkZU9uRG91YmxlQWN0aXZhdGlvbicsIGZhbHNlXG4gICAgICAgICAgICB3aW4uaGlkZSgpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIHBvc3QudG9XaW5zICdvcGVuQ3VycmVudCdcbiAgICAgICAgICAgIGFjdGl2YXRlQXBwKCkgaWYgbm90IHNsYXNoLndpbigpXG4gICAgZWxzZVxuICAgICAgICBpZiBzbGFzaC53aW4oKVxuICAgICAgICAgICAgaWYgbm90IHdpbj9cbiAgICAgICAgICAgICAgICBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGdldEFjdGl2ZUFwcCgpXG4gICAgICAgICAgICAgICAgd2luLmZvY3VzKClcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3Nhc2NyaXB0ID0gcmVxdWlyZSgnb3Nhc2NyaXB0JykuZXZhbFxuICAgICAgICAgICAgb3Nhc2NyaXB0IFwiXCJcIlxuICAgICAgICAgICAgICAgIHRlbGwgYXBwbGljYXRpb24gXCJTeXN0ZW0gRXZlbnRzXCJcbiAgICAgICAgICAgICAgICAgICAgc2V0IG4gdG8gbmFtZSBvZiBmaXJzdCBhcHBsaWNhdGlvbiBwcm9jZXNzIHdob3NlIGZyb250bW9zdCBpcyB0cnVlXG4gICAgICAgICAgICAgICAgZW5kIHRlbGxcbiAgICAgICAgICAgICAgICBkbyBzaGVsbCBzY3JpcHQgXCJlY2hvIFwiICYgblxuICAgICAgICAgICAgICAgIFwiXCJcIiwgdHlwZTonQXBwbGVTY3JpcHQnLCAoZXJyLG5hbWUpIC0+XG4gICAgICAgICAgICAgICAgICAgIGFwcE5hbWUgPSBTdHJpbmcobmFtZSkudHJpbSgpXG4gICAgICAgICAgICAgICAgICAgIGlmIG5vdCB3aW4/XG4gICAgICAgICAgICAgICAgICAgICAgICBjcmVhdGVXaW5kb3coKVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBnZXRBY3RpdmVBcHAoKVxuICAgICAgICAgICAgICAgICAgICAgICAgd2luLmZvY3VzKClcblxucmVsb2FkV2luZG93ID0gLT4gd2luLndlYkNvbnRlbnRzLnJlbG9hZElnbm9yaW5nQ2FjaGUoKVxuXG4jICAwMDAwMDAwICAwMDAwMDAwMCAgIDAwMDAwMDAwICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwMDAwMDAgIFxuIyAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMCAgICAgICBcbiMgMDAwICAgICAgIDAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgICAgMDAwICAgICAwMDAwMDAwICAgXG4jIDAwMCAgICAgICAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAgICAwMDAgICAgIDAwMCAgICAgMDAwICAgICAgIFxuIyAgMDAwMDAwMCAgMDAwICAgMDAwICAwMDAwMDAwMCAgMDAwICAgMDAwICAgICAwMDAgICAgIDAwMDAwMDAwICBcblxuY3JlYXRlV2luZG93ID0gLT5cblxuICAgIHJldHVybiBpZiB3aW4/XG5cbiAgICB3aW4gPSBuZXcgQnJvd3NlcldpbmRvd1xuICAgICAgICB3aWR0aDogICAgICAgICAgIDMwMFxuICAgICAgICBoZWlnaHQ6ICAgICAgICAgIDMwMFxuICAgICAgICBjZW50ZXI6ICAgICAgICAgIHRydWVcbiAgICAgICAgYWx3YXlzT25Ub3A6ICAgICB0cnVlXG4gICAgICAgIG1vdmFibGU6ICAgICAgICAgdHJ1ZVxuICAgICAgICByZXNpemFibGU6ICAgICAgIHRydWVcbiAgICAgICAgdHJhbnNwYXJlbnQ6ICAgICB0cnVlXG4gICAgICAgIGZyYW1lOiAgICAgICAgICAgZmFsc2VcbiAgICAgICAgbWF4aW1pemFibGU6ICAgICBmYWxzZVxuICAgICAgICBtaW5pbWl6YWJsZTogICAgIGZhbHNlXG4gICAgICAgIG1pbldpZHRoOiAgICAgICAgMjAwXG4gICAgICAgIG1pbkhlaWdodDogICAgICAgMjAwXG4gICAgICAgIG1heFdpZHRoOiAgICAgICAgNjAwXG4gICAgICAgIG1heEhlaWdodDogICAgICAgNjAwXG4gICAgICAgIGZ1bGxzY3JlZW46ICAgICAgZmFsc2VcbiAgICAgICAgc2hvdzogICAgICAgICAgICBmYWxzZVxuICAgICAgICB3ZWJQcmVmZXJlbmNlczpcbiAgICAgICAgICAgIG5vZGVJbnRlZ3JhdGlvbjogdHJ1ZVxuXG4gICAgYm91bmRzID0gcHJlZnMuZ2V0ICdib3VuZHMnXG4gICAgd2luLnNldEJvdW5kcyBib3VuZHMgaWYgYm91bmRzP1xuICAgIHdpbi5sb2FkVVJMIFwiZmlsZTovLyN7X19kaXJuYW1lfS9pbmRleC5odG1sXCJcbiAgICB3aW4ub24gJ2Nsb3NlZCcgLT4gd2luID0gbnVsbFxuICAgIHdpbi5vbiAncmVzaXplJyBvbldpblJlc2l6ZVxuICAgIHdpbi5vbiAnbW92ZScgICBzYXZlQm91bmRzXG4gICAgd2luLm9uICdyZWFkeS10by1zaG93JyAtPlxuICAgICAgICBnZXRBY3RpdmVBcHAoKVxuICAgICAgICBpZiBhcmdzLmRlYnVnXG4gICAgICAgICAgICB3aW4uc2hvdygpXG4gICAgICAgICAgICB3aW4ud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcbiAgICB3aW5cblxuc2F2ZUJvdW5kcyA9IC0+IGlmIHdpbj8gdGhlbiBwcmVmcy5zZXQgJ2JvdW5kcycsIHdpbi5nZXRCb3VuZHMoKVxuXG5zcXVhcmVUaW1lciA9IG51bGxcblxub25XaW5SZXNpemUgPSAoZXZlbnQpIC0+XG4gICAgXG4gICAgY2xlYXJUaW1lb3V0IHNxdWFyZVRpbWVyXG4gICAgYWRqdXN0U2l6ZSA9IC0+XG4gICAgICAgIGIgPSB3aW4uZ2V0Qm91bmRzKClcbiAgICAgICAgaWYgYi53aWR0aCAhPSBiLmhlaWdodFxuICAgICAgICAgICAgYi53aWR0aCA9IGIuaGVpZ2h0ID0gTWF0aC5taW4gYi53aWR0aCwgYi5oZWlnaHRcbiAgICAgICAgICAgIHdpbi5zZXRCb3VuZHMgYlxuICAgICAgICBzYXZlQm91bmRzKClcbiAgICBzcXVhcmVUaW1lciA9IHNldFRpbWVvdXQgYWRqdXN0U2l6ZSwgMzAwXG5cbnNob3dBYm91dCA9IC0+XG4gICAgXG4gICAgaWYgcHJlZnMuZ2V0KCdzY2hlbWUnLCAnYnJpZ2h0JykgPT0gJ2JyaWdodCdcbiAgICAgICAgY29sb3IgPSAnI2ZmZidcbiAgICAgICAgdGV4dGMgPSAnI2RkZCdcbiAgICAgICAgaGlnaGwgPSAnIzAwMCdcbiAgICBlbHNlXG4gICAgICAgIHRleHRjID0gJyM0NDQnXG4gICAgICAgIGhpZ2hsID0gJyNmZmYnXG4gICAgICAgIGNvbG9yID0gJyMxMTEnXG4gICAgICAgIFxuICAgIGFib3V0XG4gICAgICAgIGltZzogICAgICAgIFwiI3tfX2Rpcm5hbWV9Ly4uL2ltZy9hYm91dC5wbmdcIlxuICAgICAgICBjb2xvcjogICAgICB0ZXh0Y1xuICAgICAgICBoaWdobGlnaHQ6ICBoaWdobFxuICAgICAgICBiYWNrZ3JvdW5kOiBjb2xvclxuICAgICAgICBzaXplOiAgICAgICAyMDBcbiAgICAgICAgcGtnOiAgICAgICAgcGtnXG5cbmFwcC5vbiAnd2luZG93LWFsbC1jbG9zZWQnIChldmVudCkgLT4gZXZlbnQucHJldmVudERlZmF1bHQoKVxuXG4jMDAwMDAwMDAgICAwMDAwMDAwMCAgIDAwMDAwMDAgICAwMDAwMDAwICAgIDAwMCAgIDAwMFxuIzAwMCAgIDAwMCAgMDAwICAgICAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAgMDAwIDAwMFxuIzAwMDAwMDAgICAgMDAwMDAwMCAgIDAwMDAwMDAwMCAgMDAwICAgMDAwICAgIDAwMDAwXG4jMDAwICAgMDAwICAwMDAgICAgICAgMDAwICAgMDAwICAwMDAgICAwMDAgICAgIDAwMFxuIzAwMCAgIDAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgICAwMDBcblxuYXBwLm9uICdyZWFkeScgLT5cblxuICAgIGlmIGFwcC5yZXF1ZXN0U2luZ2xlSW5zdGFuY2VMb2NrP1xuICAgICAgICBcbiAgICAgICAgaWYgYXBwLnJlcXVlc3RTaW5nbGVJbnN0YW5jZUxvY2soKVxuICAgICAgICAgICAgYXBwLm9uICdzZWNvbmQtaW5zdGFuY2UnIHRvZ2dsZVdpbmRvd1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhcHAuZXhpdCAwXG4gICAgXG4gICAgdHJheSA9IG5ldyBUcmF5IFwiI3tfX2Rpcm5hbWV9Ly4uL2ltZy9tZW51LnBuZ1wiXG4gICAgdHJheS5vbiAnY2xpY2snLCB0b2dnbGVXaW5kb3dcbiAgICBcbiAgICBpZiBvcy5wbGF0Zm9ybSgpICE9ICdkYXJ3aW4nXG4gICAgICAgIHRyYXkuc2V0Q29udGV4dE1lbnUgTWVudS5idWlsZEZyb21UZW1wbGF0ZSBbXG4gICAgICAgICAgICBsYWJlbDogXCJRdWl0XCJcbiAgICAgICAgICAgIGNsaWNrOiAtPiBhcHAuZXhpdCAwOyBwcm9jZXNzLmV4aXQgMFxuICAgICAgICAsXG4gICAgICAgICAgICBsYWJlbDogXCJBYm91dFwiXG4gICAgICAgICAgICBjbGljazogc2hvd0Fib3V0XG4gICAgICAgICxcbiAgICAgICAgICAgIGxhYmVsOiBcIkFjdGl2YXRlXCJcbiAgICAgICAgICAgIGNsaWNrOiB0b2dnbGVXaW5kb3dcbiAgICAgICAgXVxuICAgICAgICBcbiAgICBhcHAuZG9jaz8uaGlkZSgpXG5cbiAgICAjIDAwICAgICAwMCAgMDAwMDAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMCAgICAgICAwMDAwICAwMDAgIDAwMCAgIDAwMFxuICAgICMgMDAwMDAwMDAwICAwMDAwMDAwICAgMDAwIDAgMDAwICAwMDAgICAwMDBcbiAgICAjIDAwMCAwIDAwMCAgMDAwICAgICAgIDAwMCAgMDAwMCAgMDAwICAgMDAwXG4gICAgIyAwMDAgICAwMDAgIDAwMDAwMDAwICAwMDAgICAwMDAgICAwMDAwMDAwXG5cbiAgICBNZW51LnNldEFwcGxpY2F0aW9uTWVudSBNZW51LmJ1aWxkRnJvbVRlbXBsYXRlIFtcbiAgICAgICAgbGFiZWw6IGFwcC5nZXROYW1lKClcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgICAgbGFiZWw6IFwiQWJvdXQgI3twa2cubmFtZX1cIlxuICAgICAgICAgICAgYWNjZWxlcmF0b3I6ICdDbWRPckN0cmwrLidcbiAgICAgICAgICAgIGNsaWNrOiAtPiBzaG93QWJvdXQoKVxuICAgICAgICAsXG4gICAgICAgICAgICB0eXBlOiAnc2VwYXJhdG9yJ1xuICAgICAgICAsXG4gICAgICAgICAgICBsYWJlbDogJ1F1aXQnXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NtZE9yQ3RybCtRJ1xuICAgICAgICAgICAgY2xpY2s6IC0+XG4gICAgICAgICAgICAgICAgc2F2ZUJvdW5kcygpXG4gICAgICAgICAgICAgICAgYXBwLmV4aXQgMFxuICAgICAgICAgICAgICAgIHByb2Nlc3MuZXhpdCAwXG4gICAgICAgIF1cbiAgICAsXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMCAgICAgMDAwMDAwMCAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwMCAwIDAwMCAgMDAwICAwMDAwICAwMDAgIDAwMCAgIDAwMCAgMDAwICAgMDAwICAwMDAgMCAwMDBcbiAgICAgICAgIyAwMDAwMDAwMDAgIDAwMCAgMDAwIDAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMCAgMDAwMDAwMDAwXG4gICAgICAgICMgMDAwICAgMDAwICAwMDAgIDAwMCAgMDAwMCAgMDAwICAgMDAwICAwMDAgICAwMDAgIDAwMCAgIDAwMFxuICAgICAgICAjIDAwICAgICAwMCAgMDAwICAwMDAgICAwMDAgIDAwMDAwMDAgICAgIDAwMDAwMDAgICAwMCAgICAgMDBcblxuICAgICAgICBsYWJlbDogJ1dpbmRvdydcbiAgICAgICAgc3VibWVudTogW1xuICAgICAgICAgICAgbGFiZWw6ICAgICAgICdDbG9zZSBXaW5kb3cnXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NtZE9yQ3RybCtXJ1xuICAgICAgICAgICAgY2xpY2s6ICAgICAgIC0+IHdpbj8uY2xvc2UoKVxuICAgICAgICAsXG4gICAgICAgICAgICB0eXBlOiAnc2VwYXJhdG9yJ1xuICAgICAgICAsXG4gICAgICAgICAgICBsYWJlbDogICAgICAgJ1JlbG9hZCBXaW5kb3cnXG4gICAgICAgICAgICBhY2NlbGVyYXRvcjogJ0NtZE9yQ3RybCtBbHQrTCdcbiAgICAgICAgICAgIGNsaWNrOiAgICAgICAtPiByZWxvYWRXaW5kb3coKVxuICAgICAgICAsXG4gICAgICAgICAgICBsYWJlbDogICAgICAgJ1RvZ2dsZSBEZXZUb29scydcbiAgICAgICAgICAgIGFjY2VsZXJhdG9yOiAnQ21kT3JDdHJsK0FsdCtJJ1xuICAgICAgICAgICAgY2xpY2s6ICAgICAgIC0+IHdpbj8ud2ViQ29udGVudHMub3BlbkRldlRvb2xzKClcbiAgICAgICAgXVxuICAgIF1cblxuICAgIHByZWZzLmluaXQgZGVmYXVsdHM6c2hvcnRjdXQ6J0YxJ1xuXG4gICAgZWxlY3Ryb24uZ2xvYmFsU2hvcnRjdXQucmVnaXN0ZXIgcHJlZnMuZ2V0KCdzaG9ydGN1dCcpLCB0b2dnbGVXaW5kb3dcblxuICAgIGZzLmVuc3VyZURpclN5bmMgaWNvbkRpclxuXG4gICAgc2NyID0gcmVxdWlyZSAnLi9zY3JpcHRzJ1xuICAgIGlmIHNsYXNoLndpbigpXG4gICAgICAgIHNjcmlwdHMgPSBzY3Iud2luU2NyaXB0cygpXG4gICAgZWxzZVxuICAgICAgICBzY3JpcHRzID0gc2NyLm1hY1NjcmlwdHMoKVxuICAgIFxuICAgIGZpbmRBcHBzKClcbiAgICAgICAgXG4gICAgICAgICAgICAiXX0=
//# sourceURL=../coffee/main.coffee