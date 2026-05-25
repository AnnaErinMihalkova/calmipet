jest.mock('./api', () => ({
  readingService: {
    createReading: jest.fn().mockResolvedValue({ status: 'ok' }),
  },
}));

import { parseBlePayload, CALMIPET_BLE } from './ble-device';
describe('ble-device', () => {
  test('parseBlePayload accepts standard JSON', () => {
    expect(parseBlePayload('{"heart_rate":72,"spo2":98.5,"hrv":40}')).toEqual({
      heart_rate: 72,
      spo2: 98.5,
      hrv: 40,
    });
  });

  test('parseBlePayload accepts short keys', () => {
    expect(parseBlePayload('{"hr":80,"spo2":97,"hrv":30}')).toEqual({
      heart_rate: 80,
      spo2: 97,
      hrv: 30,
    });
  });

  test('parseBlePayload rejects invalid JSON', () => {
    expect(parseBlePayload('not-json')).toBeNull();
    expect(parseBlePayload('{}')).toBeNull();
  });

  test('exports stable UUIDs', () => {
    expect(CALMIPET_BLE.deviceName).toBe('CalmIPet');
    expect(CALMIPET_BLE.serviceUuid).toMatch(/^[0-9a-f-]{36}$/i);
  });
});
