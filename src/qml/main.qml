import QtQuick 2.15
import "focus.js" as F

// Minimal Pomodoro timer for reMarkable (AppLoad). Black on white, no animations.
Rectangle {
    id: root
    color: "white"

    // Required by AppLoad on the root item
    signal close
    function unloading() { }

    readonly property real u: Math.min(width, height * 0.8)
    readonly property real pad: u * 0.05
    readonly property real cw: u - 2 * pad
    property var cfg: ({ focus: 25, short: 5, long: 15, longEvery: 4 })
    property var st: F.initial(cfg)
    property real now: Date.now()
    property bool flashOn: true
    readonly property real barH: Math.max(48, u * 0.1)

    function toggle() { now = Date.now(); st = F.toggle(st, now); }

    // Ticks once a second, and only while the timer is running
    Timer {
        interval: 1000; repeat: true; running: root.st.running
        onTriggered: {
            root.now = Date.now();
            root.st = F.tick(root.st, root.cfg, root.now).st;
        }
    }

    // Alarm: a bar across the top flashes black and white (1 s each) until you press END
    Timer {
        interval: 1000; repeat: true; running: root.st.alarm
        onRunningChanged: { if (running) root.flashOn = true; }
        onTriggered: root.flashOn = !root.flashOn
    }
    Rectangle {
        id: flashBar
        visible: root.st.alarm
        x: 0; y: 0
        width: root.width; height: root.barH
        color: root.flashOn ? "black" : "white"
        border { color: "black"; width: 3 }
        Text {
            anchors.centerIn: parent
            text: "Timer finished"
            font.pixelSize: parent.height * 0.4
            font.bold: true
            color: root.flashOn ? "white" : "black"
        }
    }

    Rectangle {
        id: card
        width: root.cw; height: root.cw * 0.9
        x: (root.width - width) / 2
        y: Math.max(root.pad + root.barH, (root.height - height) / 2 - root.height * 0.04)
        radius: root.cw * 0.04
        color: "white"
        border { color: "black"; width: 3 }

        // Tabs
        Row {
            id: tabs
            anchors { top: parent.top; topMargin: card.height * 0.07; horizontalCenter: parent.horizontalCenter }
            spacing: card.width * 0.02
            Repeater {
                model: F.MODES
                delegate: Rectangle {
                    readonly property bool on: root.st.mode === modelData
                    width: (card.width * 0.9 - 2 * tabs.spacing) / 3
                    height: card.height * 0.11
                    radius: 10
                    color: on ? "black" : "white"
                    Text {
                        anchors.centerIn: parent
                        width: parent.width - 12
                        horizontalAlignment: Text.AlignHCenter
                        text: F.LABELS[modelData]
                        font.pixelSize: parent.height * 0.42
                        font.bold: parent.on
                        fontSizeMode: Text.Fit
                        minimumPixelSize: 10
                        color: parent.on ? "white" : "black"
                    }
                    MouseArea {
                        anchors.fill: parent
                        onClicked: root.st = F.selectMode(root.st, modelData, root.cfg)
                    }
                }
            }
        }

        // Time
        Text {
            id: clock
            anchors { horizontalCenter: parent.horizontalCenter; verticalCenter: parent.verticalCenter; verticalCenterOffset: -card.height * 0.06 }
            width: card.width * 0.9
            horizontalAlignment: Text.AlignHCenter
            text: F.clockText(F.remainingMs(root.st, root.now))
            font.pixelSize: card.height * 0.3
            font.bold: true
            fontSizeMode: Text.Fit
            minimumPixelSize: 20
            color: "black"
        }

        // Silent reminder line (appears when a timer ends)
        Text {
            anchors { top: clock.bottom; topMargin: card.height * 0.02; horizontalCenter: parent.horizontalCenter }
            width: card.width * 0.9
            height: card.height * 0.07
            horizontalAlignment: Text.AlignHCenter
            verticalAlignment: Text.AlignVCenter
            text: root.st.message
            font.pixelSize: height * 0.6
            fontSizeMode: Text.Fit
            minimumPixelSize: 10
            color: "black"
        }

        // START / PAUSE / RESUME
        Rectangle {
            id: go
            anchors { horizontalCenter: parent.horizontalCenter; bottom: parent.bottom; bottomMargin: card.height * 0.08 }
            width: card.width * 0.5; height: card.height * 0.16
            radius: 12
            color: goMa.pressed ? "white" : "black"
            border { color: "black"; width: 3 }
            Text {
                anchors.centerIn: parent
                text: F.buttonLabel(root.st, root.cfg)
                font.pixelSize: parent.height * 0.4
                font.bold: true
                color: goMa.pressed ? "black" : "white"
            }
            MouseArea { id: goMa; anchors.fill: parent; onClicked: root.toggle() }
        }

        // Small reset, only after the timer has been started
        Rectangle {
            visible: F.canReset(root.st, root.cfg)
            anchors { left: go.right; leftMargin: card.width * 0.03; verticalCenter: go.verticalCenter }
            width: card.width * 0.19; height: go.height * 0.7
            radius: 10
            color: rsMa.pressed ? "black" : "white"
            border { color: "black"; width: 2 }
            Text {
                anchors.centerIn: parent
                text: "Reset"
                font.pixelSize: parent.height * 0.4
                color: rsMa.pressed ? "white" : "black"
            }
            MouseArea { id: rsMa; anchors.fill: parent; onClicked: root.st = F.selectMode(root.st, root.st.mode, root.cfg) }
        }
    }

    // Close
    Rectangle {
        anchors { horizontalCenter: parent.horizontalCenter; top: card.bottom; topMargin: root.cw * 0.08 }
        width: root.cw * 0.28; height: Math.max(48, root.cw * 0.09)
        radius: 10
        color: clMa.pressed ? "black" : "white"
        border { color: "black"; width: 2 }
        Text {
            anchors.centerIn: parent
            text: "Close"
            font.pixelSize: parent.height * 0.4
            color: clMa.pressed ? "white" : "black"
        }
        MouseArea { id: clMa; anchors.fill: parent; onClicked: root.close() }
    }
}
