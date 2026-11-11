import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/home';
import PlantsScreen from './screens/Plantas';
import PlantDetailScreen from './screens/DetalhePlanta';
import AccountScreen from './screens/Conta';
import ManagePlantsScreen from './screens/GerenciarPlantas';
import PersonalAreaScreen from './screens/MinhaArea';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#f7f5ed' },
          headerTintColor: '#244c3a',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#f7f5ed' },
        }}
      >
        <Stack.Screen name="Início" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Plantas" component={PlantsScreen} />
        <Stack.Screen name="Detalhes" component={PlantDetailScreen} />
        <Stack.Screen name="Minha conta" component={AccountScreen} />
        <Stack.Screen name="Minha área" component={PersonalAreaScreen} />
        <Stack.Screen name="Gerenciar plantas" component={ManagePlantsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
