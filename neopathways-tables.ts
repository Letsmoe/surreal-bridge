import { table, string, int, float, bool, object, type inferTable, SurrealBridge, datetime, record } from "./index";
import { lazy } from "./src/SurrealLazy";
import { SurrealStringUtils } from "./src/utils/string";

const bridge = await new SurrealBridge({
	database: "main",
	host: "localhost",
	namespace: "public",
	port: 8000,
	password: "root",
	username: "root",
}).connect()

const LocationRecordTable = await table("LocationRecord", {
	sha512: string().unique(),

	latitude: float(),
	longitude: float(),
	altitude: float().optional(),
	accuracy: float().optional(),
	altitudeAccuracy: float().optional(),
	heading: float().optional(),
	speed: float().optional(),
	validationAccuracy: float(),
	
	outdated: bool(),
	tags: string().array(),
	notes: string().optional(),
	additional: object().optional(),
}, bridge).deploy()

const MedicalRecordTable = table("MedicalRecord", {
	sha512: string().unique(),
	created: datetime().default(SurrealStringUtils.time().now()),
	updated: datetime().default(SurrealStringUtils.time().now()),

	user: record([lazy(() => UserTable)]),
	type: string(),
	description: string().optional(),
	notes: string().optional()
}, bridge)

const UserTable = await table("User", {
	name: string(),
	MedicalRecords: record([lazy<any>(() => MedicalRecordTable)]).array()
}, bridge).deploy();

await MedicalRecordTable.deploy()

const result = await MedicalRecordTable.findMany({
	where: {
		sha512: ""
	},
	include: {
		
	}
})

const user = await UserTable.create({
	data: {
		name: "John Doe",
		MedicalRecords: []
	}
})

const medicalRecord = await MedicalRecordTable.create({
	data: {
		type: "Test",
		description: "Test",
		notes: "Test",
		user: user[0].id,
		sha512: Math.random().toString()
	}
})
