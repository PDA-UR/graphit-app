export interface WBItem {
    type: string,
    labels: {
        en: string,
        de: string | undefined,
    },
    descriptions: {
        en: string | undefined,
        de: string | undefined,
    },
    aliases: {
        en: string[] | undefined,
        de: string[] | undefined, 
    },
    claims: any
}