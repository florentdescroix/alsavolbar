# alsavolbar
Gnome extension that adds a volume bar for ALSA

# Installation
Copy all the files in ~/.local/share/gnome-shell/extensions/alsavolbar@florentdescroix@github.com

# Configuration
The extension detects any ALSA volume change, system wide.  
So you can, for instance, specify some new Hotkey via the Gnome settings.  
Here are some useful command :
* Mute : `amixer sset Master mute`
* Unmute : `amixer sset Master unmute`
* Increase volume by 5% : `amixer sset Master 5%+`
* Decrease volume by 5% : `amixer sset Master 5%-`
* Increase volume by 5dB : `amixer sset Master 5dB+`
* Decrease volume by 5dB : `amixer sset Master 5dB-`
* Set volume at 50% : `amixer sset Master 50%`
* Set volume at 50% : `amixer sset Master 50dB`

# TODO
The extension so far only alter and listen the Master control.
* Add a setting check list with all the controls
* Display all the checked control in the extension drop down menu
* Add a button to quickly access those settings

# How to disable PulseAudio (if wanted)
Disable the `pulseAudio` startup with this command  
`# mv /etc/xdg/autostart/pulseaudio.desktop /etc/xdg/autostart/pulseaudio.desktop.bak`  
Then disable the services
```
systemctl --user disable pulseaudio.socket
systemctl --user disable pulseaudio.services
systemctl --user stop pulseaudio.socket
systemctl --user stop pulseaudio.services
systemctl --user mask pulseaudio.socket
systemctl --user mask pulseaudio.services
```