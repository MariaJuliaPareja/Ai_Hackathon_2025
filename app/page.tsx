import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Shield, 
  Clock, 
  Sparkles,
  ArrowRight,
  Star,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Users
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Care Connect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Iniciar Sesión</Button>
              </Link>
              <Link href="/register">
                <Button>Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Badge className="mb-4 bg-pink-100 text-pink-800 border-pink-200">
              <Heart className="h-3 w-3 mr-1" />
              Cuidado con Confianza y Dignidad
            </Badge>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Tus Seres Queridos
              <br />
              Merecen
              <br />
              <span className="text-green-600">Cuidado Excepcional</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-6 leading-relaxed">
              Toda familia conoce ese sentimiento: Mamá necesita ayuda, pero ¿cómo encuentras a alguien en quien realmente puedas confiar? 
              ¿Alguien que la trate con la dignidad que se merece?
            </p>
            <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
              Care Connect combina la calidez de la compasión humana con la precisión de la IA para conectar a tu familia con cuidadores que realmente entienden.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register?role=senior">
                <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6">
                  Busco Cuidador
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register?role=caregiver">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 py-6">
                  Soy Cuidador
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl p-8 shadow-xl">
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img 
                  src="/cuidado.jpeg" 
                  alt="Cuidado profesional con confianza y dignidad" 
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4 border-2 border-gray-100">
              <div className="text-3xl font-bold text-orange-600">9.5M+</div>
              <div className="text-sm text-gray-600 mt-1">
                Adultos mayores en<br />
                América Latina necesitan<br />
                cuidado de calidad
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Por qué elegir Care Connect
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tecnología avanzada al servicio del cuidado humano
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Matching con IA</CardTitle>
              <CardDescription>
                Nuestro algoritmo de inteligencia artificial analiza compatibilidad, 
                habilidades y necesidades para encontrar el mejor match.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Cuidadores Verificados</CardTitle>
              <CardDescription>
                Todos los cuidadores pasan por un proceso de verificación riguroso, 
                incluyendo evaluaciones psicológicas y verificación de certificaciones.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-2 hover:border-blue-300 transition-colors">
            <CardHeader>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Soporte 24/7</CardTitle>
              <CardDescription>
                Nuestro equipo está disponible las 24 horas para brindarte apoyo 
                y resolver cualquier duda o emergencia.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cómo Funciona
          </h2>
        </div>
        <div className="grid md:grid-cols-4 gap-8 relative">
          {/* Background numbers */}
          <div className="absolute inset-0 flex items-center justify-between px-8 pointer-events-none">
            <span className="text-[200px] font-bold text-gray-100">01</span>
            <span className="text-[200px] font-bold text-gray-100">02</span>
            <span className="text-[200px] font-bold text-gray-100">03</span>
            <span className="text-[200px] font-bold text-gray-100">04</span>
          </div>
          
          <Card className="relative border-2 hover:border-teal-300 transition-colors bg-white/90">
            <CardHeader>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Onboarding Simple</CardTitle>
              <CardDescription className="text-base">
                Cuéntanos sobre las necesidades, preferencias y personalidad de tu ser querido. Escuchamos para entender.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="relative border-2 hover:border-teal-300 transition-colors bg-white/90">
            <CardHeader>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Matching Inteligente</CardTitle>
              <CardDescription className="text-base">
                Nuestra IA analiza miles de perfiles para encontrar cuidadores con las habilidades correctas y el ajuste emocional adecuado.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="relative border-2 hover:border-teal-300 transition-colors bg-white/90">
            <CardHeader>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Feedback Continuo</CardTitle>
              <CardDescription className="text-base">
                Comparte tu experiencia y ayúdanos a mejorar. Tu feedback moldea mejor cuidado para todos.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="relative border-2 hover:border-teal-300 transition-colors bg-white/90">
            <CardHeader>
              <div className="h-12 w-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-teal-600" />
              </div>
              <CardTitle>Monitoreo Transparente</CardTitle>
              <CardDescription className="text-base">
                Actualizaciones en tiempo real, registros de cuidado y comunicación abierta te mantienen conectado e informado.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-teal-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              La Realidad en América Latina y Perú
            </h2>
            <p className="text-xl text-teal-100">
              La necesidad de cuidado de calidad para adultos mayores nunca ha sido mayor.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-teal-500/50 border-teal-400">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-orange-400 mb-4">9.5M</div>
                <div className="text-white text-lg font-medium mb-2">
                  Adultos Mayores en<br />
                  América Latina
                </div>
                <div className="text-teal-100 text-sm">
                  necesitan soluciones de cuidado de calidad
                </div>
              </CardContent>
            </Card>
            <Card className="bg-teal-500/50 border-teal-400">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-orange-400 mb-4">25.7%</div>
                <div className="text-white text-lg font-medium mb-2">
                  Población mayor de 60 años
                </div>
                <div className="text-teal-100 text-sm">
                  aumentará para 2050 en América Latina
                </div>
              </CardContent>
            </Card>
            <Card className="bg-teal-500/50 border-teal-400">
              <CardContent className="p-8">
                <div className="text-5xl font-bold text-orange-400 mb-4">2,000+</div>
                <div className="text-white text-lg font-medium mb-2">
                  Personas Diariamente
                </div>
                <div className="text-teal-100 text-sm">
                  cumplen 60 años en América Latina
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Inspirational Quote Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center max-w-4xl mx-auto">
          <div className="text-[120px] md:text-[150px] font-bold text-green-200 leading-none mb-4">
            "
          </div>
          <blockquote className="text-3xl md:text-4xl font-serif text-gray-800 mb-6 leading-relaxed">
            Cuidar a quienes una vez nos cuidaron es uno de los mayores honores. Con Care Connect, no lo haces solo.
          </blockquote>
          <div className="w-24 h-1 bg-teal-600 mx-auto"></div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-xl text-gray-600">
            Historias reales de cuidado y confianza
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-base">
                "Encontré a la cuidadora perfecta para mi madre en menos de una semana. 
                El sistema de matching es increíble y me dio mucha confianza ver todas 
                las verificaciones."
              </CardDescription>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">María González</p>
                <p className="text-sm text-gray-500">Hija de adulto mayor</p>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-base">
                "Como cuidador, me encanta cómo la plataforma me conecta con familias 
                que realmente necesitan mis habilidades específicas. Es muy profesional."
              </CardDescription>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">Carlos Ramírez</p>
                <p className="text-sm text-gray-500">Cuidador profesional</p>
              </div>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-base">
                "La tranquilidad de saber que todos los cuidadores están verificados 
                y evaluados hace que este proceso sea mucho más fácil para nuestra familia."
              </CardDescription>
              <div className="mt-4">
                <p className="font-semibold text-gray-900">Ana Martínez</p>
                <p className="text-sm text-gray-500">Familiar responsable</p>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl my-20">
        <div className="text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Únete a nuestra comunidad de cuidado confiable
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register?role=senior">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Busco Cuidador
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register?role=caregiver">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-gray-100">
                Soy Cuidador
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="h-6 w-6 text-blue-400" />
                <span className="text-xl font-bold text-white">Care Connect</span>
              </div>
              <p className="text-sm">
                Conectando adultos mayores con cuidadores verificados 
                mediante tecnología de IA avanzada.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Para Familias</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register?role=senior" className="hover:text-white">
                    Buscar Cuidador
                  </Link>
                </li>
                <li>
                  <Link href="/register?role=family" className="hover:text-white">
                    Registro Familiar
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-white">
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Para Cuidadores</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register?role=caregiver" className="hover:text-white">
                    Registrarse como Cuidador
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/caregiver" className="hover:text-white">
                    Tablero de Trabajos
                  </Link>
                </li>
                <li>
                  <Link href="/questionnaire/caregiver" className="hover:text-white">
                    Cuestionarios
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contacto</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+51 999 999 999</span>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>info@careconnect.com</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Lima, Perú</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Care Connect. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
