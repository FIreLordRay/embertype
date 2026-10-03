' Opens embertype with no console window. This is what the desktop shortcut runs.
'
'   1. Rebuilds the app (about a second), so code changes always show up.
'   2. Starts the local server on http://localhost:4173, unless it's already running.
'   3. Opens embertype in your default browser.
'
' The server keeps running in the background (it's tiny), so the next launch is instant.
' To stop it: Task Manager > "Node.js JavaScript Runtime" > End task. Or just restart the PC.
' Want to see the server's output instead? Double-click run.cmd.
Option Explicit

Const PORT = "4173" ' must match preview.port in vite.config.js
Const URL = "http://localhost:4173"

Dim shell, fso, appDir, node, vite, i
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = appDir

' Full path to node.exe, like Radial's launcher uses the full Python path: a bare "node"
' depends on PATH, which can differ when Windows starts a script from a shortcut.
node = """" & shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"""
vite = """" & appDir & "\node_modules\vite\bin\vite.js"""

If Not fso.FileExists(Replace(node, """", "")) Then
  MsgBox "Node.js wasn't found at " & node & "." & vbCrLf & "Install it from nodejs.org.", vbExclamation, "embertype"
  WScript.Quit 1
End If
If Not fso.FolderExists(appDir & "\node_modules") Then
  MsgBox "First-time setup needed: double-click run.cmd once (it installs everything).", vbInformation, "embertype"
  WScript.Quit 1
End If

' 1. Build, hidden, and wait for it to finish.
If shell.Run(node & " " & vite & " build", 0, True) <> 0 Then
  MsgBox "The build failed, so embertype can't start." & vbCrLf & _
         "Double-click run.cmd to see the error.", vbExclamation, "embertype"
  WScript.Quit 1
End If

' 2. Start the server unless it's already running, then wait (up to ~10 s) until it listens.
If Not IsServing() Then
  shell.Run node & " " & vite & " preview", 0, False
  For i = 1 To 50
    If IsServing() Then Exit For
    WScript.Sleep 200
  Next
End If

' 3. Open it.
shell.Run URL

' Is anything listening on our port? Asks netstat (hidden, about 0.2 s) rather than sending an
' HTTP request: on Windows a request to a port nobody listens on takes about 4 s to fail,
' because Windows retries refused connections to localhost.
Function IsServing()
  IsServing = (shell.Run("cmd /c netstat -ano | findstr /r /c:"":" & PORT & " .*LISTENING"" >nul", 0, True) = 0)
End Function
