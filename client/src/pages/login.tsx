import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida")
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
  onLogin: (user: User) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: ""
    }
  });
  
  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      onLogin(data.user);
      toast({
        title: "Inicio de sesión exitoso",
        description: `Bienvenido, ${data.user.name}`,
      });
    },
    onError: () => {
      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsSubmitting(false);
    }
  });
  
  const onSubmit = (data: LoginFormData) => {
    setIsSubmitting(true);
    loginMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-100">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">SupportDesk</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa tu nombre de usuario" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Ingresa tu contraseña" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-sm text-neutral-500 text-center">
            <p>Cuentas por defecto:</p>
            <p>
              <span className="font-medium">Usuario:</span> user, <span className="font-medium">Contraseña:</span> user123
            </p>
            <p>
              <span className="font-medium">Agente:</span> agent, <span className="font-medium">Contraseña:</span> agent123
            </p>
            <p>
              <span className="font-medium">Admin:</span> admin, <span className="font-medium">Contraseña:</span> admin123
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
