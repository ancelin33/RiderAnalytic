import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView 
} from 'react-native';

export default function App() {
  // 1. ÉTATS DU SKATER
  const [pseudo, setPseudo] = useState('ShredderFloirac');
  const [age, setAge] = useState('28');
  const [taille, setTaille] = useState('180');
  const [poids, setPoids] = useState('74');
  const [stance, setStance] = useState('Goofy'); // Regular / Goofy
  const [pays, setPays] = useState('France');
  const [ville, setVille] = useState('Floirac');

  // 2. ÉTATS DU STYLE (AVATAR)
  const [longueurCheveux, setLongueurCheveux] = useState('Court');
  const [couleurCheveux, setCouleurCheveux] = useState('#5c4033'); // Code couleur
  const [couleurTshirt, setCouleurTshirt] = useState('#1a1a1a');
  const [typeBas, setTypeBas] = useState('Pantalon'); // Pantalon / Short / Slip
  const [couleurBas, setCouleurBas] = useState('#c2b280');
  const [couleurChaussures, setCouleurChaussures] = useState('#ffffff');

  // 3. ÉTATS DU MATÉRIEL (SKATE)
  const [taillePlanche, setTaillePlanche] = useState('8.25"');
  const [couleurPlanche, setCouleurPlanche] = useState('#008080');
  const [avecGrip, setAvecGrip] = useState(true);
  const [couleurGrip, setCouleurGrip] = useState('#000000');
  const [tailleRoues, setTailleRoues] = useState('54mm');
  const [dureteRoues, setDureteRoues] = useState('90a');
  const [couleurRoues, setCouleurRoues] = useState('#f8f9fa');

  // Fonction de sauvegarde
  const handleSave = () => {
    const profilComplet = {
      skater: { pseudo, age, taille, poids, stance, pays, ville },
      style: { longueurCheveux, couleurCheveux, couleurTshirt, typeBas, couleurBas, couleurChaussures },
      skate: { taillePlanche, couleurPlanche, avecGrip, couleurGrip, tailleRoues, dureteRoues, couleurRoues }
    };
    console.log("Sauvegarde du profil :", profilComplet);
    alert("Profil enregistré ! 🛹");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        <Text style={styles.mainTitle}>🛠️ Personnalisation</Text>

        {/* SECTION 1 : LE SKATER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 1. Mon Profil</Text>
          
          <Text style={styles.label}>Pseudo</Text>
          <TextInput style={styles.input} value={pseudo} onChangeText={setPseudo} placeholder="Pseudo" />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Âge (ans)</Text>
              <TextInput style={styles.input} value={age} onChangeText={setAge} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Taille (cm)</Text>
              <TextInput style={styles.input} value={taille} onChangeText={setTaille} keyboardType="numeric" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Poids (kg)</Text>
              <TextInput style={styles.input} value={poids} onChangeText={setPoids} keyboardType="numeric" />
            </View>
          </View>

          <Text style={styles.label}>Stance (Position)</Text>
          <View style={styles.btnGroup}>
            {['Regular', 'Goofy'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.btnGroupOption, stance === item && styles.btnGroupOptionActive]}
                onPress={() => setStance(item)}
              >
                <Text style={[styles.btnGroupText, stance === item && styles.btnGroupTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Ville</Text>
          <TextInput style={styles.input} value={ville} onChangeText={setVille} />
        </View>

        {/* SECTION 2 : LE STYLE (AVATAR) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👕 2. Mon Style</Text>

          <Text style={styles.label}>Longueur de cheveux</Text>
          <View style={styles.btnGroup}>
            {['Court', 'Mi-long', 'Long', 'Rasé'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.btnGroupOption, longueurCheveux === item && styles.btnGroupOptionActive]}
                onPress={() => setLongueurCheveux(item)}
              >
                <Text style={[styles.btnGroupText, longueurCheveux === item && styles.btnGroupTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Type de Bas</Text>
          <View style={styles.btnGroup}>
            {['Pantalon', 'Short', 'Slip'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.btnGroupOption, typeBas === item && styles.btnGroupOptionActive]}
                onPress={() => setTypeBas(item)}
              >
                <Text style={[styles.btnGroupText, typeBas === item && styles.btnGroupTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SECTION 3 : LE SKATE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}> Boardwalk 🛹 3. Mon Skate</Text>

          <Text style={styles.label}>Taille de la planche (Largeur)</Text>
          <View style={styles.btnGroup}>
            {['7.75"', '8.0"', '8.25"', '8.5"'].map((item) => (
              <TouchableOpacity 
                key={item} 
                style={[styles.btnGroupOption, taillePlanche === item && styles.btnGroupOptionActive]}
                onPress={() => setTaillePlanche(item)}
              >
                <Text style={[styles.btnGroupText, taillePlanche === item && styles.btnGroupTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Grip</Text>
          <View style={styles.btnGroup}>
            <TouchableOpacity 
              style={[styles.btnGroupOption, avecGrip && styles.btnGroupOptionActive]}
              onPress={() => setAvecGrip(true)}
            >
              <Text style={[styles.btnGroupText, avecGrip && styles.btnGroupTextActive]}>Avec Grip</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btnGroupOption, !avecGrip && styles.btnGroupOptionActive]}
              onPress={() => setAvecGrip(false)}
            >
              <Text style={[styles.btnGroupText, !avecGrip && styles.btnGroupTextActive]}>Sans Grip</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Taille Roues</Text>
              <TextInput style={styles.input} value={tailleRoues} onChangeText={setTailleRoues} placeholder="ex: 54mm" />
            </View>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Dureté Roues</Text>
              <TextInput style={styles.input} value={dureteRoues} onChangeText={setDureteRoues} placeholder="ex: 90a" />
            </View>
          </View>
        </View>

        {/* BOUTON SAUVEGARDE */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 Enregistrer le Profil</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Arrière-plan sombre moderne
  },
  scrollContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 25,
  },
  section: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#38bdf8', // Accent bleu skate
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  col: {
    width: '30%',
  },
  halfCol: {
    width: '48%',
  },
  btnGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  btnGroupOption: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#0f172a',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  btnGroupOptionActive: {
    backgroundColor: '#38bdf8',
    borderColor: '#38bdf8',
  },
  btnGroupText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  btnGroupTextActive: {
    color: '#0f172a',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#10b981', // Vert émeraude
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
