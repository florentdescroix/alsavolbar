const { GObject, St, Gio } = imports.gi;

const Meta = imports.gi.Meta
const Shell = imports.gi.Shell

const Main = imports.ui.main;
const Panel = Main.panel;
const { Button } = imports.ui.panelMenu;
const { PopupBaseMenuItem, PopupMenuItem, PopupMenu } = imports.ui.popupMenu;
const { Slider } = imports.ui.slider;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const AlsaVolume = Me.imports.alsaVolume.Indicator;

var AlsaVolbarButton = GObject.registerClass({
    GTypeName: 'AlsaVolbar'
}, class AlsaVolbarButton extends Button {
  _init() {
    super._init(0);
    
    this._bindedKeys = [];
    this.menu._volumes = {};
    this.accessible_name = 'AlsaVolbar';
    this.menu.actor.add_style_class_name('aggregate-menu');

    this.menu._volumes.Master = (new AlsaVolume('Master'));
    this.menu.addMenuItem(this.menu._volumes.Master.menu);
    
    this._indicator = new St.Icon({
      icon_name: 'audio-volume-medium-symbolic',
      style_class: 'system-status-icon'
    });
    this.add_child(this._indicator);

    this.menu._volumes.Master.connect('icon-changed', () => {
      this._indicator.icon_name = this.menu._volumes.Master._indicator.icon_name;
    });
  }

	destroy() {
	  for (let i = 0; i < this._bindedKeys.length; i++) {
	    Main.wm.removeKeybinding(this._bindedKeys[i]);
	  }
		super.destroy();
	}
});

let alsavolbarindicator;

function enable() {
	alsavolbarindicator = new AlsaVolbarButton();
	Main.panel.addToStatusArea('AlsaVolbarButton', alsavolbarindicator);
}

function disable() {
	alsavolbarindicator.destroy();
}
