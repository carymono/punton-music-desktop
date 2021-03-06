import Sequelize from 'sequelize'
import path from 'path'
import { app } from 'electron'

export default new Sequelize('punton', 'punton_music_desktop', '', {
  host: 'localhost',
  dialect: 'sqlite',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  storage: path.join(app.getPath('userData'), 'punton.db'),
  logging: false
})
