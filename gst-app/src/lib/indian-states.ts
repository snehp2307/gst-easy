// Indian state codes for GSTIN validation and place-of-supply determination

export interface IndianState {
    code: string;
    name: string;
    ut: boolean; // Union Territory
}

export const INDIAN_STATES: IndianState[] = [
    { code: '01', name: 'Jammu & Kashmir', ut: true },
    { code: '02', name: 'Himachal Pradesh', ut: false },
    { code: '03', name: 'Punjab', ut: false },
    { code: '04', name: 'Chandigarh', ut: true },
    { code: '05', name: 'Uttarakhand', ut: false },
    { code: '06', name: 'Haryana', ut: false },
    { code: '07', name: 'Delhi', ut: true },
    { code: '08', name: 'Rajasthan', ut: false },
    { code: '09', name: 'Uttar Pradesh', ut: false },
    { code: '10', name: 'Bihar', ut: false },
    { code: '11', name: 'Sikkim', ut: false },
    { code: '12', name: 'Arunachal Pradesh', ut: false },
    { code: '13', name: 'Nagaland', ut: false },
    { code: '14', name: 'Manipur', ut: false },
    { code: '15', name: 'Mizoram', ut: false },
    { code: '16', name: 'Tripura', ut: false },
    { code: '17', name: 'Meghalaya', ut: false },
    { code: '18', name: 'Assam', ut: false },
    { code: '19', name: 'West Bengal', ut: false },
    { code: '20', name: 'Jharkhand', ut: false },
    { code: '21', name: 'Odisha', ut: false },
    { code: '22', name: 'Chhattisgarh', ut: false },
    { code: '23', name: 'Madhya Pradesh', ut: false },
    { code: '24', name: 'Gujarat', ut: false },
    { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu', ut: true },
    { code: '27', name: 'Maharashtra', ut: false },
    { code: '28', name: 'Andhra Pradesh (old)', ut: false },
    { code: '29', name: 'Karnataka', ut: false },
    { code: '30', name: 'Goa', ut: false },
    { code: '31', name: 'Lakshadweep', ut: true },
    { code: '32', name: 'Kerala', ut: false },
    { code: '33', name: 'Tamil Nadu', ut: false },
    { code: '34', name: 'Puducherry', ut: true },
    { code: '35', name: 'Andaman & Nicobar Islands', ut: true },
    { code: '36', name: 'Telangana', ut: false },
    { code: '37', name: 'Andhra Pradesh', ut: false },
    { code: '38', name: 'Ladakh', ut: true },
    { code: '97', name: 'Other Territory', ut: false },
];

export const STATE_MAP = new Map(INDIAN_STATES.map(s => [s.code, s]));

export function getStateName(code: string): string | undefined {
    return STATE_MAP.get(code)?.name;
}

export function isValidStateCode(code: string): boolean {
    return STATE_MAP.has(code);
}
