import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, POPULAR_SHOWS } from '../utils/constants';
import { analyzeShow, searchShows } from '../utils/api';
import { getRecentSearches, addToRecents, cacheAnalysis, getCachedAnalysis } from '../utils/storage';
import { ShowCard } from '../components/ShowCard';
import { ShowAnalysis } from '../types';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recents, setRecents] = useState<ShowAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    loadRecents();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(headerAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  async function loadRecents() {
    const r = await getRecentSearches();
    setRecents(r);
  }

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchShows(text);
      setSuggestions(results);
      setSearching(false);
    }, 500);
  }, []);

  async function handleSearch(title: string) {
    if (!title.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSuggestions([]);
    setQuery('');

    try {
      // Check cache first
      const id = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      let analysis = await getCachedAnalysis(id);

      if (!analysis) {
        analysis = await analyzeShow(title);
        await cacheAnalysis(analysis);
      }

      await addToRecents(analysis);
      await loadRecents();

      router.push({
        pathname: '/result',
        params: { data: JSON.stringify(analysis) },
      });
    } catch (err) {
      Alert.alert(
        'Oops!',
        'We couldn\'t find information about that show. Try a different title.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  }

  function handleShowCardPress(show: ShowAnalysis) {
    router.push({
      pathname: '/result',
      params: { data: JSON.stringify(show) },
    });
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: headerAnim }] }]}>
          <Text style={styles.appName}>CalmScreen</Text>
          <Text style={styles.tagline}>Is this show okay for your toddler's nervous system?</Text>
        </Animated.View>

        {/* Search box */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchBox}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.input}
              placeholder="Search any show or movie…"
              placeholderTextColor={Colors.textLight}
              value={query}
              onChangeText={handleQueryChange}
              returnKeyType="search"
              onSubmitEditing={() => query.trim() && handleSearch(query.trim())}
              autoCorrect={false}
              autoCapitalize="words"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(''); setSuggestions([]); }}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color={Colors.sageDark} size="small" />
              <Text style={styles.loadingText}>Analyzing nervous system impact…</Text>
            </View>
          )}

          {/* Suggestions dropdown */}
          {suggestions.length > 0 && !loading && (
            <View style={styles.dropdown}>
              {searching && (
                <View style={styles.dropdownRow}>
                  <ActivityIndicator size="small" color={Colors.sageDark} />
                </View>
              )}
              {suggestions.map((title, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dropdownRow, i < suggestions.length - 1 && styles.dropdownBorder]}
                  onPress={() => handleSearch(title)}
                >
                  <Text style={styles.dropdownIcon}>📺</Text>
                  <Text style={styles.dropdownText}>{title}</Text>
                  <Text style={styles.dropdownArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Popular shows */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <View style={styles.chips}>
            {POPULAR_SHOWS.map((show) => (
              <TouchableOpacity
                key={show}
                style={styles.chip}
                onPress={() => handleSearch(show)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{show}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent searches */}
        {recents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recently Analyzed</Text>
            {recents.slice(0, 5).map((show) => (
              <ShowCard
                key={show.id}
                show={show}
                onPress={() => handleShowCardPress(show)}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {recents.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>👶</Text>
            <Text style={styles.emptyTitle}>Search any show</Text>
            <Text style={styles.emptyBody}>
              We'll tell you how it affects your toddler's nervous system — pace, noise, visuals, emotional intensity, and more.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 24,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    color: Colors.textMid,
    lineHeight: 22,
  },
  searchWrapper: {
    marginBottom: 28,
    zIndex: 100,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 10,
  },
  searchIcon: { fontSize: 18 },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    height: '100%',
  },
  clearBtn: {
    fontSize: 16,
    color: Colors.textLight,
    padding: 4,
  },
  loadingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMid,
    fontStyle: 'italic',
  },
  dropdown: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  dropdownBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownIcon: { fontSize: 16 },
  dropdownText: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' },
  dropdownArrow: { fontSize: 16, color: Colors.textLight },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textLight,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMid,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptyBody: { fontSize: 14, color: Colors.textMid, textAlign: 'center', lineHeight: 22 },
});
