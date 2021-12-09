const { Gio, GLib } = imports.gi
const Signals = imports.signals

var Executable = class {
    constructor(cmd) {
        try {
            this.proc = Gio.Subprocess.new(
                ['bash', '-c', cmd],
                (Gio.SubprocessFlags.STDIN_PIPE |
                    Gio.SubprocessFlags.STDOUT_PIPE)
            )

            // Watch for the process to exit, like normal
            this.proc.wait_async(null, (proc, res) => {
                try {
                    proc.wait_finish(res)
                } catch (e) {
                    logError(e)
                }
            })
        
            // Get the `stdin`and `stdout` pipes, wrapping `stdout` to make it easier to
            // read lines of text
            this.outputStream = new Gio.DataInputStream({
                base_stream: this.proc.get_stdout_pipe(),
                close_base_stream: true
            })
            this._readOutput(this.outputStream)
        } catch (e) {
            logError(e)
        }
    }

    _readOutput(stdout) {
        stdout.read_line_async(GLib.PRIORITY_LOW, null, (stdout, res) => {
            try {
                let line = stdout.read_line_finish_utf8(res)[0]
                if (line !== null) {
                    this.emit('stdout', line)
                    this._readOutput(stdout)
                }
            } catch (e) {
                logError(e)
            }
        })
    }
}
Signals.addSignalMethods(Executable.prototype)