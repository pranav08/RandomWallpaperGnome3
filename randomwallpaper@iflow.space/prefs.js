const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gtk = imports.gi.Gtk;
const Gdk = imports.gi.Gdk;
const Lang = imports.lang;
const ExtensionUtils = imports.misc.extensionUtils;

const Self = ExtensionUtils.getCurrentExtension();
const Convenience = Self.imports.convenience;

const Gettext = imports.gettext.domain('space.iflow.randomwallpaper');
//const _ = Gettext.gettext;

const RWG_SETTINGS_SCHEMA = 'org.gnome.shell.extensions.space.iflow.randomwallpaper';
const RWG_SETTINGS_SCHEMA_DESKTOPPER = 'org.gnome.shell.extensions.space.iflow.randomwallpaper.desktopper';
const RWG_SETTINGS_SCHEMA_UNSPLASH = 'org.gnome.shell.extensions.space.iflow.randomwallpaper.unsplash';
const RWG_SETTINGS_SCHEMA_WALLHEAVEN = 'org.gnome.shell.extensions.space.iflow.randomwallpaper.wallheaven';
const RWG_SETTINGS_SCHEMA_GENERIC_JSON = 'org.gnome.shell.extensions.space.iflow.randomwallpaper.genericJSON';

const LoggerModule = Self.imports.logger;

function init() {
	//Convenience.initTranslations();
}

function buildPrefsWidget() {
	let settings = new RandomWallpaperSettings();
	let widget = settings.widget;
	widget.show_all();

	return widget;
}

/* UI Setup */
var RandomWallpaperSettings = new Lang.Class({
	Name: 'RandomWallpaper.Settings',
	logger: null,

	currentSourceSettingsWidget: null,

	noSettings: null,
	desktopperSettings: null,
	unsplashSettings: null,
	wallheavenSettings: null,
	genericJsonSettings: null,

	_init: function () {
		this._settings = Convenience.getSettings(RWG_SETTINGS_SCHEMA);
		this._builder = new Gtk.Builder();
		//this._builder.set_translation_domain(Self.metadata['gettext-domain']);
		this._builder.add_from_file(Self.path + '/settings.ui');

		this.logger = new LoggerModule.Logger('RWG3', 'RandomWallpaper.Settings');

		this.noSettings = this._builder.get_object('no-settings');

		// Desktopper Settings
		this._desktopper_settings = Convenience.getSettings(RWG_SETTINGS_SCHEMA_DESKTOPPER);
		this.desktopperSettings = this._builder.get_object('desktopper-settings');
		this.bindDesktopper();

		// Unsplash Settings
		this._unsplash_settings = Convenience.getSettings(RWG_SETTINGS_SCHEMA_UNSPLASH);
		this.unsplashSettings = this._builder.get_object('unsplash-settings');
		this.bindUnsplash();

		// Wallheaven Settings
		this._wallheaven_settings = Convenience.getSettings(RWG_SETTINGS_SCHEMA_WALLHEAVEN);
		this.wallheavenSettings = this._builder.get_object('wallheaven-settings');
		this.bindWallheaven();

		// Generic JSON Settings
		this._generic_json_settings = Convenience.getSettings(RWG_SETTINGS_SCHEMA_GENERIC_JSON);
		this.genericJsonSettings = this._builder.get_object('generic-json-settings');
		this.bindGenericJSON();

		this._toggleAfSliders();

		this.widget = this._builder.get_object('main-widget');

		this._builder.get_object('af-switch').connect('notify::active', function (toggleSwitch) {
			this._toggleAfSliders();
		}.bind(this));

		this._builder.get_object('source-combo').connect('changed', (sourceCombo) => {
			let container = this._builder.get_object('source-settings-container');
			if (this.currentSourceSettingsWidget !== null) {
				container.remove(this.currentSourceSettingsWidget);
			}

			switch (sourceCombo.active) {
				case 0: // unsplash
					this.currentSourceSettingsWidget = this.unsplashSettings;
					break;
				case 1: // desktopper
					this.currentSourceSettingsWidget = this.desktopperSettings;
					break;
				case 2: // wallheaven
					this.currentSourceSettingsWidget = this.wallheavenSettings;
					break;
				case 3: // generic JSON
					this.currentSourceSettingsWidget = this.genericJsonSettings;
					break;
				default:
					this.currentSourceSettingsWidget = this.noSettings;
					break;
			}

			container.add(this.currentSourceSettingsWidget);
		});

		this._settings.bind('history-length',
			this._builder.get_object('history-length'),
			'value',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('minutes',
			this._builder.get_object('duration-minutes'),
			'value',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('hours',
			this._builder.get_object('duration-hours'),
			'value',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('source',
			this._builder.get_object('source-combo'),
			'active-id',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('auto-fetch',
			this._builder.get_object('af-switch'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('change-lock-screen',
			this._builder.get_object('change-lock-screen'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
		this._settings.bind('disable-hover-preview',
			this._builder.get_object('disable-hover-preview'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
	},

	_toggleAfSliders: function () {
		if (this._builder.get_object('af-switch').active) {
			this._builder.get_object('duration-slider-hours').set_sensitive(true);
			this._builder.get_object('duration-slider-minutes').set_sensitive(true);
		} else {
			this._builder.get_object('duration-slider-hours').set_sensitive(false);
			this._builder.get_object('duration-slider-minutes').set_sensitive(false);
		}
	},

	bindDesktopper: function () {
		this._desktopper_settings.bind('allow-unsafe',
			this._builder.get_object('desktopper-allow-unsafe'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
	},

	bindUnsplash: function () {
		this._unsplash_settings.bind('unsplash-keyword',
			this._builder.get_object('unsplash-keyword'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);
		this._unsplash_settings.bind('username',
			this._builder.get_object('unsplash-username'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);

		this._unsplash_settings.bind('image-width',
			this._builder.get_object('unsplash-image-width'),
			'value',
			Gio.SettingsBindFlags.DEFAULT);
		this._unsplash_settings.bind('image-height',
			this._builder.get_object('unsplash-image-height'),
			'value',
			Gio.SettingsBindFlags.DEFAULT);
		this._unsplash_settings.bind('featured-only',
			this._builder.get_object('unsplash-featured-only'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
	},

	bindWallheaven: function () {
		this._wallheaven_settings.bind('wallheaven-keyword',
			this._builder.get_object('wallheaven-keyword'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);
		this._wallheaven_settings.bind('resolutions',
			this._builder.get_object('wallheaven-resolutions'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);

		this._wallheaven_settings.bind('category-general',
			this._builder.get_object('wallheaven-category-general'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
		this._wallheaven_settings.bind('category-anime',
			this._builder.get_object('wallheaven-category-anime'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
		this._wallheaven_settings.bind('category-people',
			this._builder.get_object('wallheaven-category-people'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);

		this._wallheaven_settings.bind('allow-sfw',
			this._builder.get_object('wallheaven-allow-sfw'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
		this._wallheaven_settings.bind('allow-sketchy',
			this._builder.get_object('wallheaven-allow-sketchy'),
			'active',
			Gio.SettingsBindFlags.DEFAULT);
	},

	bindGenericJSON: function () {
		this._builder.get_object('generic-json-docs-link').set_label("More information here");
		this._generic_json_settings.bind('generic-json-request-url',
			this._builder.get_object('generic-json-request-url'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);
		this._generic_json_settings.bind('generic-json-response-path',
			this._builder.get_object('generic-json-response-path'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);
		this._generic_json_settings.bind('generic-json-url-prefix',
			this._builder.get_object('generic-json-url-prefix'),
			'text',
			Gio.SettingsBindFlags.DEFAULT);
	}

});
