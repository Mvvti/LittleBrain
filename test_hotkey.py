import keyboard
print("Rejestruję hotkey...")
keyboard.add_hotkey("ctrl+shift+space", lambda: print("DZIAŁA!"))
print("Wciśnij Ctrl+Shift+Space... (Esc żeby wyjść)")
keyboard.wait("esc")