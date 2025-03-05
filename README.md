# Aerial 3d

Aerial stuff in 3d!

This project is a monorepo, with two apps:

- `controller` is responsible for collecting data from the device on which its running
- `display` is responsible for displaying the data that is collected from the controller

The `controller` is able to send data to the `display` using
[peerjs](https://github.com/peers/peerjs), (which is a simple implementation of
WebRTC).

## Local Development

To start the apps up:
- `npm run dev -w controller`
- `npm run dev -w display`
