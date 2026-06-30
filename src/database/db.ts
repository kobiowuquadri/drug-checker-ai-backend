import { Sequelize } from 'sequelize';
import { config } from "../config/config.js";

const sequelize = new Sequelize(
  config.database.name || '',
  config.database.user || '',
  config.database.password || '',
  {
    host: config.database.host,
    port: Number(config.database.port) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
)

export const connectToDB = async () => {
  try {
    await sequelize.authenticate()
    console.log("Connected to the database Successfully.")

    await sequelize.sync()
    const { ensureReportColumns } = await import('./schemaPatches.js')
    await ensureReportColumns()

    if (process.env.AUTO_SEED_INTERACTIONS !== 'false') {
      const { seedDrugInteractions } = await import('./seeders/seedDrugInteractions.js')
      await seedDrugInteractions()
    }

    if (process.env.AUTO_SEED_MEDICATIONS !== 'false') {
      const { seedMedications } = await import('./seeders/seedMedications.js')
      await seedMedications()
    }
    
  } catch (error : any) {
    console.log("Unable to connect to the database:", error.message)
  }
}

export default sequelize
