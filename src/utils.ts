export function getErrorMessage(error: any): string {
    const body = JSON.parse(error.error.body)

    return body.error.message
}
