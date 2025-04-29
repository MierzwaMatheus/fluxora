
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Define a função que verifica o tamanho da tela
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Verifica imediatamente
    checkMobile()
    
    // Adiciona um listener para mudanças de tamanho da tela
    window.addEventListener("resize", checkMobile)
    
    // Limpeza ao desmontar o componente
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}
