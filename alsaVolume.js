const { Gio, GObject, St, GLib } = imports.gi
const Signals = imports.signals

const Main = imports.ui.main
const PanelMenu = imports.ui.panelMenu
const PopupMenu = imports.ui.popupMenu
const Slider = imports.ui.slider

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Executable = Me.imports.executable.Executable;

let alsawatcher

var AlsaProxy = class {
    constructor(device_name) {
        if (!alsawatcher) {
            alsawatcher = new Executable(`stdbuf -oL alsactl monitor`)
        }

        this._semaphore = false
        this._volume = 0
        this._mute = false
        this._device = device_name

        alsawatcher.connect('stdout', (obj, line) => {
            let device = line.match(/.*,(.*) Playback/)
            if (device && device[1] === this._device) {
                // Limit the call off update function when many event are received successively
                if (this._semaphore)
                    GLib.source_remove(this._semaphore)
                this._semaphore = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 50, () => {
                    this._update()
                    this._semaphore = false
                    return GLib.SOURCE_REMOVE
                })
            }
        })
        this._update(true)
    }

    get volume() {
        return this._volume
    }

    set volume(value) {
        this._volume = value
        new Executable(`amixer sset '${this._device}' ${value}%`)
    }

    get mute() {
        return this._mute
    }

    set mute(value) {
        this._mute = value
        new Executable(`amixer sset '${this._device}' ${value ? 'mute' : 'unmute'}%`)
    }

    _update(first = false) {
        let amixer = new Executable(`amixer sget '${this._device}'`)
        amixer.connect('stdout', (obj, line) => {
            let volume = line.match(/\d{1,2}\s\[(\d{1,3})\%\]/)
            let mute = line.match(/\[(on|off)\]/)
            if (volume && mute) {
                this._volume = volume[1] * 1
                this._mute = mute[1] === "off"
                this.emit('changed', first)
            }
        })
    }
}
Signals.addSignalMethods(AlsaProxy.prototype)

var Indicator = GObject.registerClass({
    Signals: {'icon-changed': {}}
}, class Indicator extends PanelMenu.SystemIndicator {
    _init(device_name) {
        super._init()
        this._semaphore = false
        this._device = device_name
        this._proxy = new AlsaProxy(this._device)
        this._proxy.connect('changed', (proxy, first) => {
            this._sync(first)
        })

        this._icons = [
            'audio-volume-muted-symbolic',
            'audio-volume-low-symbolic',
            'audio-volume-medium-symbolic',
            'audio-volume-high-symbolic'
        ]

        this._item = new PopupMenu.PopupBaseMenuItem({ activate: false })
        this.menu.addMenuItem(this._item)

        this._slider = new Slider.Slider(0)
        this._sliderChangedId = this._slider.connect('notify::value', () => {
            this._sliderChanged()
            // Avoiding to change slider and propt osd when the change is done by the widget itself
            if (this._semaphore)
                GLib.source_remove(this._semaphore)
            this._semaphore = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
                this._semaphore = false
                return GLib.SOURCE_REMOVE
            })
        })
        this._slider.accessible_name = _("Volume")

        this._indicator = new St.Icon({ 
            icon_name: this._icons[2],
            style_class: 'popup-menu-icon' 
        })
        this._item.add(this._indicator)
        this._item.add_child(this._slider)
        this._item.connect('button-press-event', (actor, event) => {
            this._proxy.mute = !this._proxy.mute
        })
        this._item.connect('key-press-event', (actor, event) => {
            return this._slider.emit('key-press-event', event)
        })
        this._item.connect('scroll-event', (actor, event) => {
            return this._slider.emit('scroll-event', event)
        })
    }

    _changeIcon() {
        let volume = this._proxy.volume
        let mute = this._proxy.mute
        let n
        if (mute || volume <= 0) {
            n = 0
        } else {
            n = Math.ceil(3 * volume / 100)
            n = Math.clamp(n, 1, this._icons.length - 1)
        }
        if (this._icons[n] !== this._indicator.icon_name) {
            this._indicator.icon_name = this._icons[n]
            this.emit('icon-changed')
        }
    }

    _sliderChanged() {
        let percent = this._slider.value * 100
        this._proxy.volume = Math.round(percent)
        this._changeIcon()
    }

    _changeSlider(value) {
        this._slider.block_signal_handler(this._sliderChangedId)
        this._slider.value = value
        this._slider.unblock_signal_handler(this._sliderChangedId)
    }

    _sync(first) {
        if (!this._semaphore) {
            this._changeSlider(this._proxy.volume / 100.0)
            this._changeIcon()
            if (!first)
                Main.osdWindowManager.show(0, Gio.icon_new_for_string(this._indicator.icon_name), this._device, this._proxy.volume / 100, 1)
        }
        if (!first) {
            let player = global.display.get_sound_player()
            player.play_from_theme("audio-volume-change", this._device, null)
        }
    }
})
