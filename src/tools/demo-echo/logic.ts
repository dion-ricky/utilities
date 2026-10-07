export interface EchoOptions {
  reverse: boolean
  uppercase: boolean
}

export function echoTransform(input: string, options: EchoOptions): string {
  let output = input
  if (options.reverse) {
    output = [...output].reverse().join('')
  }
  if (options.uppercase) {
    output = output.toUpperCase()
  }
  return output
}
