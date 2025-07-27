declare module 'heic2any' {
  interface ConversionOptions {
    blob: Blob
    toType?: string
    quality?: number
  }
  
  function heic2any(options: ConversionOptions): Promise<Blob | Blob[]>
  export = heic2any
} 