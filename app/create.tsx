import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wand as Wand2, LogIn, ChevronDown } from 'lucide-react-native';
import { generateStory, isOpenAIConfigured } from '@/lib/openai';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

const THEMES = [
  'Adventure & Exploration',
  'Fantasy & Magic',
  'Animals & Nature',
  'Fairy Tales & Folklore',
  'Friendship & Family',
  'Educational & Moral Lessons',
  'Humor & Fun',
  'Science Fiction & Space',
  'Mystery & Detective',
  'Everyday Life & School',
];

const FAMOUS_BOOKS = [
  'Treasure Island',
  'Around the World in Eighty Days',
  'Twenty Thousand Leagues Under the Seas',
  'Journey to the Center of the Earth',
  'The Adventures of Tom Sawyer',
  'The Adventures of Huckleberry Finn',
  'Oliver Twist',
  'The Jungle Book',
  'Robinson Crusoe',
  "Gulliver's Travels",
  'Heidi',
  'Peter Pan',
  'Anne of Green Gables',
  'The Call of the Wild',
  'White Fang',
  'Little Lord Fauntleroy',
  'The Merry Adventures of Robin Hood',
  'Swiss Family Robinson',
  'The Secret Garden',
  'Black Beauty',
];

export default function CreateStory() {
  const [age, setAge] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedType, setSelectedType] = useState<'theme' | 'book' | 'own'>('theme');
  const [selectedTheme, setSelectedTheme] = useState(THEMES[0]);
  const [selectedBook, setSelectedBook] = useState(FAMOUS_BOOKS[0]);
  const [ownStoryBrief, setOwnStoryBrief] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState<'theme' | 'book'>('theme');
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (!user) {
        router.replace('/');
      }
    } catch (err) {
      console.error('Error checking user:', err);
      setError('Failed to check authentication status');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
      setError('Please sign in to generate stories');
      router.replace('/');
      return;
    }

    if (!age || !duration || (selectedType === 'own' && !ownStoryBrief)) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setIsGenerating(true);

    try {
      let storyTheme;
      if (selectedType === 'theme') {
        storyTheme = selectedTheme;
      } else if (selectedType === 'book') {
        storyTheme = selectedBook;
      } else {
        storyTheme = ownStoryBrief;
      }

      const story = await generateStory(
        parseInt(age, 10),
        parseInt(duration, 10),
        storyTheme
      );

      const { error: insertError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          title: story.title,
          content: story.content,
          age: parseInt(age, 10),
          duration: parseInt(duration, 10),
          theme: storyTheme,
        });

      if (insertError) throw insertError;

      setAge('');
      setDuration('');
      setSelectedType('theme');
      setSelectedTheme(THEMES[0]);
      setSelectedBook(FAMOUS_BOOKS[0]);
      setOwnStoryBrief('');
      router.push('/history');
    } catch (err: any) {
      if (err.message.includes('Story limit reached')) {
        setError('Story generation is temporarily unavailable. Please try again tomorrow.');
      } else {
        setError(err.message || 'Failed to generate story. Please try again.');
      }
      console.error('Story generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderSelector = (type: 'theme' | 'book') => {
    const isTheme = type === 'theme';
    const value = isTheme ? selectedTheme : selectedBook;
    const options = isTheme ? THEMES : FAMOUS_BOOKS;

    if (Platform.OS === 'web') {
      return (
        <select
          value={value}
          onChange={(e) => {
            if (isTheme) {
              setSelectedTheme(e.target.value);
            } else {
              setSelectedBook(e.target.value);
            }
          }}
          disabled={isGenerating || selectedType !== type}
          style={{
            width: '100%',
            padding: '16px',
            fontSize: '16px',
            fontFamily: 'Inter-Regular',
            color: selectedType === type ? '#1F2937' : '#9CA3AF',
            backgroundColor: selectedType === type ? '#ffffff' : '#F3F4F6',
            border: `1px solid ${selectedType === type ? '#D1D5DB' : '#E5E7EB'}`,
            borderRadius: '12px',
            appearance: 'none',
            backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 16px center',
            backgroundSize: '12px',
            cursor: selectedType === type ? 'pointer' : 'not-allowed',
          }}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.selectorButton,
          selectedType !== type && styles.selectorButtonDisabled,
        ]}
        onPress={() => {
          if (selectedType === type) {
            setPickerType(type);
            setShowPicker(true);
          }
        }}
        disabled={isGenerating || selectedType !== type}
      >
        <Text
          style={[
            styles.selectorButtonText,
            selectedType !== type && styles.selectorButtonTextDisabled,
          ]}
        >
          {value}
        </Text>
        <ChevronDown
          size={20}
          color={selectedType === type ? '#6B7280' : '#9CA3AF'}
        />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create a Story</Text>
          <Text style={styles.subtitle}>Please sign in to continue</Text>
        </View>
        <View style={styles.signInContainer}>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => router.replace('/')}
          >
            <LogIn size={24} color="#ffffff" style={styles.buttonIcon} />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>Create a Story</Text>
          <Text style={styles.subtitle}>
            Fill in the details below to generate a unique story for your child
          </Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age Group</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="Years"
              keyboardType="number-pad"
              maxLength={2}
              editable={!isGenerating}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Story Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              placeholder="Enter duration (e.g., 10)"
              keyboardType="number-pad"
              maxLength={2}
              editable={!isGenerating}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Story Source</Text>
            <View style={styles.segmentedControl}>
              {['theme', 'book', 'own'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.segmentButton,
                    selectedType === type && styles.segmentButtonActive,
                  ]}
                  onPress={() => setSelectedType(type as 'theme' | 'book' | 'own')}
                  disabled={isGenerating}
                >
                  <Text
                    style={[
                      styles.segmentButtonText,
                      selectedType === type && styles.segmentButtonTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            {selectedType === 'own' ? (
              <>
                <Text style={styles.label}>Story Brief</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={ownStoryBrief}
                  onChangeText={setOwnStoryBrief}
                  placeholder="Describe your story idea briefly..."
                  multiline
                  numberOfLines={4}
                  editable={!isGenerating}
                  placeholderTextColor="#9CA3AF"
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>
                  {selectedType === 'theme' ? 'Select Theme' : 'Select Book'}
                </Text>
                {renderSelector(selectedType as 'theme' | 'book')}
              </>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.generateButton,
              (!age || !duration || (selectedType === 'own' && !ownStoryBrief) || isGenerating) && 
              styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={!age || !duration || (selectedType === 'own' && !ownStoryBrief) || isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Wand2 size={24} color="#ffffff" style={styles.buttonIcon} />
                <Text style={styles.generateButtonText}>Generate Story</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {Platform.OS !== 'web' && showPicker && (
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>
                {pickerType === 'theme' ? 'Select Theme' : 'Select Book'}
              </Text>
              <TouchableOpacity
                style={styles.pickerDoneButton}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.pickerDoneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <Picker
              selectedValue={pickerType === 'theme' ? selectedTheme : selectedBook}
              onValueChange={(itemValue) => {
                if (pickerType === 'theme') {
                  setSelectedTheme(itemValue);
                } else {
                  setSelectedBook(itemValue);
                }
                setShowPicker(false);
              }}
            >
              {(pickerType === 'theme' ? THEMES : FAMOUS_BOOKS).map((option) => (
                <Picker.Item
                  key={option}
                  label={option}
                  value={option}
                  color="#1F2937"
                />
              ))}
            </Picker>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 24,
    backgroundColor: '#7C3AED',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Quicksand-Bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
  },
  form: {
    padding: 24,
    margin: 24,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  segmentButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  segmentButtonTextActive: {
    color: '#1F2937',
    fontFamily: 'Inter-SemiBold',
  },
  selectorButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  selectorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  selectorButtonTextDisabled: {
    color: '#9CA3AF',
  },
  generateButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  generateButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  pickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  pickerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  pickerDoneButton: {
    padding: 8,
  },
  pickerDoneButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#7C3AED',
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  signInButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
});