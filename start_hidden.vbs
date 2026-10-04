' Opens embertype with no console window. This is what the desktop shortcut runs.
'
'   1. Rebuilds the app (about a second), so code changes always show up.
'   2. Starts the local server on http://localhost:4173, unless it's already running.
'   3. Opens embertype in your default browser.
'
' The server keeps running in the background (it's tiny), so the next launch is instant.
' It serves each new build straight from disk, so a running server never shows old code.
' To stop it: Task Manager > "Node.js JavaScript Runtime" > End task. Or just restart the PC.
' Want to see the server's output instead? Double-click run.cmd.
Option Explicit

Const PORT = 4173 ' must match preview.port in vite.config.js
Const URL = "http://localhost:4173/"
Const START_TIMEOUT = 15 ' seconds to wait for the server to start

Dim shell, fso, appDir, node, vite, started
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
appDir = fso.GetParentFolderName(WScript.ScriptFullName)
shell.CurrentDirectory = appDir

node = FindNode()
If node = "" Then
  MsgBox "Node.js wasn't found. Install it from nodejs.org, then try again.", vbExclamation, "embertype"
  WScript.Quit 1
End If
node = """" & node & """"
vite = """" & appDir & "\node_modules\vite\bin\vite.js"""

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

' 2. Start the server unless it's already running, then wait until it listens.
If Listening() Then
  If Not IsEmbertype() Then
    MsgBox "Another program is using port " & PORT & ", so embertype can't start." & vbCrLf & _
           "Close that program, then try again.", vbExclamation, "embertype"
    WScript.Quit 1
  End If
Else
  shell.Run node & " " & vite & " preview", 0, False
  started = Now
  Do Until Listening()
    If DateDiff("s", started, Now) > START_TIMEOUT Then
      MsgBox "embertype's server didn't start." & vbCrLf & _
             "Double-click run.cmd to see why.", vbExclamation, "embertype"
      WScript.Quit 1
    End If
    WScript.Sleep 200
  Loop
End If

' 3. Open it.
shell.Run URL

' Full path to node.exe: a bare "node" depends on PATH, which can differ when Windows starts a
' script from a shortcut. The standard installer's folder first, then whatever PATH finds
' (nvm, Volta, Scoop, fnm, a 32-bit install …), asked hidden and read back from a temp file.
Function FindNode()
  Dim path, tmp, file
  FindNode = ""
  path = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\nodejs\node.exe"
  If fso.FileExists(path) Then
    FindNode = path
    Exit Function
  End If
  tmp = fso.BuildPath(fso.GetSpecialFolder(2), "embertype-where-node.txt") ' 2 = the temp folder
  shell.Run "cmd /c where node > """ & tmp & """ 2>nul", 0, True
  If Not fso.FileExists(tmp) Then Exit Function
  Set file = fso.OpenTextFile(tmp)
  If Not file.AtEndOfStream Then path = Trim(file.ReadLine) Else path = ""
  file.Close
  fso.DeleteFile tmp
  If path <> "" And fso.FileExists(path) Then FindNode = path
End Function

' Is anything listening on our port? Asks Windows' own TCP table through WMI: about 0.1 s,
' and no window. Not netstat, which prints the state in the system's language ("LISTENING"
' only in English). Not an HTTP request either: on Windows, one to a port nobody listens on
' takes about 4 s to fail, because Windows retries refused connections to localhost.
Function Listening()
  Dim connection
  Listening = False
  For Each connection In GetObject("winmgmts:\\.\root\StandardCimv2").ExecQuery( _
      "SELECT LocalPort FROM MSFT_NetTCPConnection WHERE LocalPort = " & PORT & " AND State = 2")
    Listening = True ' State 2 means listening
  Next
End Function

' Is it embertype on our port, and not some other program? Only asked once something is
' listening, so the request is quick.
Function IsEmbertype()
  Dim http
  IsEmbertype = False
  On Error Resume Next
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.setTimeouts 2000, 2000, 2000, 3000
  http.open "GET", URL, False
  http.send
  If Err.Number = 0 Then IsEmbertype = (http.status = 200 And InStr(http.responseText, "<title>embertype</title>") > 0)
  On Error GoTo 0
End Function
