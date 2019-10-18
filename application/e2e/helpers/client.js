import { ClientFunction } from 'testcafe';

export const getLocation = ClientFunction(url => document.location);
