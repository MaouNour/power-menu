import GLib from 'gi://GLib';
import Gio from 'gi://Gio';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { PowerMenuOverlay } from './powerMenuOverlay.js';
import { PowerMenuIndicator } from './powerMenuIndicator.js';

const DBUS_IFACE = `
<node>
  <interface name="org.gnome.Shell.Extensions.PowerMenu">
    <method name="toggleOverlay"/>
  </interface>
</node>`;

export default class PowerMenuExtension extends Extension {
    enable() {
        this._overlay = null;
        this._indicator = new PowerMenuIndicator(this);

        // Place it 'right' under plain GNOME Shell; 'center' under Dash to Panel.
        this._addIndicatorSourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._addIndicatorSourceId = null;
            Main.panel.addToStatusArea(this.uuid, this._indicator, -1,
                global.dashToPanel ? 'center' : 'right');
            return GLib.SOURCE_REMOVE;
        });

        this._dbus = Gio.DBusExportedObject.wrapJSObject(DBUS_IFACE, this);
        this._dbus.export(Gio.DBus.session, '/org/gnome/Shell/Extensions/PowerMenu');
    }

    disable() {
        this._dbus.unexport();
        this._dbus = null;

        if (this._addIndicatorSourceId) {
            GLib.Source.remove(this._addIndicatorSourceId);
            this._addIndicatorSourceId = null;
        }

        this._overlay?.destroy();
        this._indicator.destroy();
        this._indicator = null;
    }

    toggleOverlay() {
        if (this._overlay) {
            this._overlay.close();
            return;
        }

        this._overlay = new PowerMenuOverlay(() => {
            this._overlay = null;
        });
        this._overlay.open();
    }
}
