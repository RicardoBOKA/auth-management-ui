const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config');
require('dotenv').config({ path: '../../.env' });
const connection = mongoose.createConnection(config.getConfig().mongo_db);
const { uid } = require('uid/secure');

const configDirectory = path.resolve(process.cwd(), 'main/mongo');

//MONGO

const Alarms = new mongoose.Schema({
  id: {
    type: String,
    unique: true
  },
  alarm_type: String,
  tenant: String,
  servicepath: String,
  entity_id: String,
  entity_type: String,
  channel_type: String,
  channel_destination: [String],
  time_unit: String,
  max_time_since_last_update: Number,
  alarm_frequency_time_unit: String,
  alarm_frequency_time: Number,
  time_of_last_alarm: String,
  status: String
});
const Alarm = connection.model('Alarms', Alarms);

async function getTheAlarmsMongo(data) {
  const AlarmsData =
    data.servicePath === ''
      ? await Alarm.find({ tenant: data.tenantName })
      : await Alarm.find({
          $and: [{ tenant: data.tenantName }, { servicepath: data.servicePath }]
        });
  return AlarmsData;
}
async function deleteThisAlarmMongo(data) {
  const AlarmsData = await Alarm.find({ id: data.id });
  let deletedAlarms = {};
  for (const e of AlarmsData) {
    deletedAlarms = await Alarm.findByIdAndRemove(e._id);
  }
  return AlarmsData;
}
async function addAlarmMongo(data) {
  const arrayOfData = {
    id: uid(16),
    alarm_type: data.alarm_type,
    tenant: data.tenant,
    servicepath: data.servicepath,
    entity_id: data.entity_id,
    entity_type: data.entity_type,
    channel_type: data.channel_type,
    channel_destination: data.channel_destination,
    time_unit: data.time_unit,
    max_time_since_last_update: data.max_time_since_last_update,
    alarm_frequency_time_unit: data.alarm_frequency_time_unit,
    alarm_frequency_time: data.alarm_frequency_time,
    time_of_last_alarm: data.time_of_last_alarm,
    status: data.status
  };
  await Alarm.create(arrayOfData);
  return [arrayOfData];
}
async function updateThisAlarmMongo(data) {
  const filter = {
    id: data.id
  };
  const AlarmsData = await Alarm.find(filter);
  const update = {
    id: AlarmsData[0].id,
    alarm_type: data.alarm_type,
    tenant: data.tenant,
    servicepath: data.servicepath,
    entity_id: data.entity_id,
    entity_type: data.entity_type,
    channel_type: data.channel_type,
    channel_destination: data.channel_destination,
    time_unit: data.time_unit,
    max_time_since_last_update: data.max_time_since_last_update,
    alarm_frequency_time_unit: data.alarm_frequency_time_unit,
    alarm_frequency_time: data.alarm_frequency_time,
    time_of_last_alarm: data.time_of_last_alarm,
    status: data.status
  };
  const session = await connection.startSession();

  await session.withTransaction(async (session) => {
     Alarm.findOneAndUpdate(filter, update,{session:session});
    });
  return [update];
}

//json
async function getTheAlarmsjson(data) {
  return json.parse(fs.readFileSync(path.join(configDirectory, 'alarms.json'), 'utf8'));
}
async function deleteThisAlarmjson(data) {
  let old = json.parse(fs.readFileSync(path.join(configDirectory, 'alarms.json'), 'utf8'));
  const index = old.findIndex((x) => x.id === data.id);
  old.splice(index, 1);
  fs.writeFile(path.join(configDirectory, 'alarms.json'), json.stringify(old), (error) => {
    if (error) {
      console.error(error);
    }
  });
  return [old[index]];
}
async function addAlarmjson(data) {
  let old = json.parse(fs.readFileSync(path.join(configDirectory, 'alarms.json'), 'utf8'));
  data.id = uid(16);
  old.push(data);
  fs.writeFile(path.join(configDirectory, 'alarms.json'), json.stringify(old), (error) => {
    if (error) {
      console.error(error);
    }
  });
  return [data];
}
async function updateThisAlarmjson(data) {
  let old = json.parse(fs.readFileSync(path.join(configDirectory, 'alarms.json'), 'utf8'));
  const index = old.findIndex((x) => x.id === data.id);
  old[index] = data;
  fs.writeFile(path.join(configDirectory, 'alarms.json'), json.stringify(old), (error) => {
    if (error) {
      console.error(error);
    }
  });
  return [data];
}

async function getTheAlarms(data) {
  console.log( (process.env.ALARMS_SAVE).toLowerCase())
  switch (true) {
    case (process.env.ALARMS_SAVE).toLowerCase() === 'json':
      return await getTheAlarmsjson(data);
    case (process.env.ALARMS_SAVE).toLowerCase() === 'mongo':
      return await getTheAlarmsMongo(data);
    default:
      return await getTheAlarmsjson(data);
  }
}
async function deleteThisAlarm(data) {
  switch (true) {
    case (process.env.ALARMS_SAVE).toLowerCase() === 'json':
      return await deleteThisAlarmjson(data);
    case (process.env.ALARMS_SAVE).toLowerCase() === 'mongo':
      return await deleteThisAlarmMongo(data);
    default:
      return await deleteThisAlarmjson(data);
  }
}
async function addAlarm(data) {
  switch (true) {
    case (process.env.ALARMS_SAVE).toLowerCase() === 'json':
      return await addAlarmjson(data);
    case (process.env.ALARMS_SAVE).toLowerCase() === 'mongo':
      return await addAlarmMongo(data);
    default:
      return await addAlarmjson(data);
  }
}
async function updateThisAlarm(data) {
  switch (true) {
    case (process.env.ALARMS_SAVE).toLowerCase() === 'json':
      return await updateThisAlarmjson(data);
    case (process.env.ALARMS_SAVE).toLowerCase() === 'mongo':
      return await updateThisAlarmMongo(data);
    default:
      return await updateThisAlarmjson(data);
  }
}

module.exports = {
  getTheAlarms,
  deleteThisAlarm,
  addAlarm,
  updateThisAlarm
};
