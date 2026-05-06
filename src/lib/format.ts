export function capitalize(value: string) {
   return value
      .split(" ")
      .map((word) =>
         word ? word.charAt(0).toUpperCase() + word.slice(1) : word
      )
      .join(" ");
}