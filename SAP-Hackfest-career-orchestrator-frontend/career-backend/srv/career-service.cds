using career from '../db/schema';

@path: '/career'
service CareerService {
    entity Profiles as projection on career.Profiles;
}
