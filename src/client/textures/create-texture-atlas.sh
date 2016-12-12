#!/bin/sh

# Combines individual images made in Piskel into a texture
# Textures should be power of two dimensioned (eg 32x64)
convert flower-wallpaper.png flower-windows.png floor.png ceiling.png -append room.png
