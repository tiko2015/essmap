# Certificado para generar apk

Este certificado es necesario para crear una realease de la aplicación en [ionic](https://dashboard.ionicframework.com/app/fd3acf44/build/builds)

[Ver Documentación](https://ionic.io/docs/appflow/package/credentials?_gl=1*ip0p8n*_gcl_au*OTUxODM2OTc0LjE3MzAyOTg3NjI.*_ga*MTkwMDk4NDQ1My4xNzMwMjk4NzYy*_ga_REH9TJF6KF*MTczNDM3ODc4NC4xOS4xLjE3MzQzNzg4MzEuMC4wLjA.#generating-with-keytool)

Comando:

```
keytool -genkey -v -keystore essapp2.keystore -alias essapp2 -keyalg RSA -keysize 2048 -validity 10000 -storetype PKCS12
```

Clave: `imfc2024`
