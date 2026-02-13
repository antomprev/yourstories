import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Trash2, RefreshCcw, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import CachedBackground, { BACKGROUND_IMAGES } from '@/components/CachedBackground';

interface Story {
  story_id: string;
  title: string;
  age: number;
  created_at: string;
  content: string;
  theme: string;
  duration: 'Short' | 'Standard' | 'Long';
}

export default function History() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadStories();

    // Set up auto-refresh interval
    const refreshInterval = setInterval(() => {
      loadStories(false); // Pass false to avoid showing loading indicators
    }, 10000); // 10 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, []);

  const loadStories = async (showLoading = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view your stories');
        return;
      }

      if (showLoading) {
        setLoading(true);
      }

      const { data, error: fetchError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Database error:', fetchError);
        throw new Error(`Failed to fetch stories: ${fetchError.message}`);
      }
      
      setStories(data || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to load stories';
      setError(errorMessage);
      console.error('Error loading stories:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const handleDelete = async (storyId: string) => {
    try {
      setDeleting(storyId);
      setError(null);

      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('story_id', storyId);

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        throw new Error(`Failed to delete story: ${deleteError.message}`);
      }

      setStories(prevStories => prevStories.filter(story => story.story_id !== storyId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete story';
      setError(errorMessage);
      console.error('Error deleting story:', err);
    } finally {
      setDeleting(null);
    }
  };

  const confirmDelete = (storyId: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to delete this story?')) {
        handleDelete(storyId);
      }
    } else {
      Alert.alert(
        'Delete Story',
        'Are you sure you want to delete this story?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => handleDelete(storyId),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const renderStoryItem = ({ item }: { item: Story }) => (
    <View style={styles.storyCard}>
      <TouchableOpacity
        style={styles.storyContent}
        onPress={() => router.push(`/story/${item.story_id}`)}
      >
        <View style={styles.storyHeader}>
          <Text style={styles.storyTitle}>{item.title}</Text>
          <ChevronRight size={20} color="#6B7280" />
        </View>
        <View style={styles.storyDetails}>
          <Text style={styles.storyDetail}>Age: {item.age}</Text>
          <Text style={styles.storyDetail}>
            <Clock size={14} color="#6B7280" style={styles.durationIcon} />
            {item.duration}
          </Text>
          <Text style={styles.storyDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.storyTheme} numberOfLines={1}>
          Theme: {item.theme}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => confirmDelete(item.story_id)}
        disabled={deleting === item.story_id}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        {deleting === item.story_id ? (
          <ActivityIndicator size="small" color="#EF4444" />
        ) : (
          <Trash2 size={20} color="#EF4444" />
        )}
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <CachedBackground uri={BACKGROUND_IMAGES.main} style={styles.backgroundImage}>
        <View style={styles.overlay}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
          </View>
        </View>
      </CachedBackground>
    );
  }

  return (
    <CachedBackground uri={BACKGROUND_IMAGES.main} style={styles.backgroundImage}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>My Stories</Text>
            <Text style={styles.subtitle}>Your collection of magical tales</Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setRefreshing(true);
                  loadStories();
                }}
              >
                <RefreshCcw size={16} color="#ffffff" style={styles.retryIcon} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={stories}
              renderItem={renderStoryItem}
              keyExtractor={(item) => item.story_id}
              contentContainerStyle={styles.listContainer}
              onRefresh={loadStories}
              refreshing={refreshing}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No stories yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Create your first story in the Create Story tab
                  </Text>
                </View>
              }
            />
          )}
        </SafeAreaView>
      </View>
    </CachedBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Quicksand-Bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#ffffff',
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'rgba(254, 226, 226, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    padding: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryIcon: {
    marginRight: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  storyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  storyContent: {
    flex: 1,
    padding: 16,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    flex: 1,
  },
  storyDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  storyDetail: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationIcon: {
    marginRight: 4,
  },
  storyDate: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  storyTheme: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    fontStyle: 'italic',
  },
  deleteButton: {
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(229, 231, 235, 0.8)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#4B5563',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});