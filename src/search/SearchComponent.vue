<!--Copied from UI Version 6.0 TODO import from UI with small changes e.g. hide Show All Button -->
<template>
  <v-sheet>
    <span
      class="d-flex justify-space-between align-center mt-1 ml-2 mb-2 search-component outlined"
    >
      <v-icon class="pa-1" :size="searchIconSize"> $vcsSearch </v-icon>
      <VcsTextField
        class="d-inline-block user-select-none w-100 mx-1"
        autofocus
        :loading="searching"
        clearable
        :placeholder="$t('search.placeholder')"
        v-model="query"
        @keydown.enter="search"
        @keydown.down.stop.prevent="selectSuggestion(1)"
        @keydown.up.stop.prevent="selectSuggestion(-1)"
        @input="onInput"
        @click:clear="reset"
      />
    </span>
    <template v-if="results.length > 0">
      <v-divider class="mt-1 base-darken-1" />
      <ResultsComponent :query="query" :results="results" />
      <v-divider />
    </template>
    <template v-else-if="suggestionsComp.length > 0">
      <v-divider class="mt-1 base-darken-1" />
      <ResultsComponent
        class="suggestions"
        :results="suggestionsComp"
        :query="query"
        :selected-index="selectedSuggestion"
      />
    </template>
  </v-sheet>
</template>

<style lang="scss" scoped>
  :deep(.v-field .v-field__outline *) {
    border-color: transparent !important;
  }

  .user-select-none {
    user-select: none;
  }

  .suggestions {
    font-style: italic;
  }
</style>

<script setup lang="ts">
  // used from map/ui and input search field redesigned
  import { inject, ref, Ref, computed } from 'vue';
  import { getLogger } from '@vcsuite/logger';
  import { v4 as uuid } from 'uuid';
  import { VSheet, VDivider, VIcon } from 'vuetify/components';
  import {
    useFontSize,
    ResultsComponent,
    VcsTextField,
    VcsUiApp,
  } from '@vcmap/ui';

  const app = inject('vcsApp') as VcsUiApp;
  const searching = ref(false);
  const suggesting = ref('');
  const query = ref(null) as Ref<string | null>;
  const suggestions = ref([]) as Ref<string[]>;
  const selectedSuggestion = ref(-1);
  const results = app.search.currentResults;
  let queryPreSuggestion = '';

  let suggestionTimeout: undefined | NodeJS.Timeout;

  const onInput = (): void => {
    app.search.clearResults();
    const trimmedInput = query.value?.trim() ?? '';
    if (trimmedInput.length > 0) {
      const requestId = uuid();
      if (suggestionTimeout) {
        clearTimeout(suggestionTimeout);
      }
      suggestionTimeout = setTimeout(() => {
        suggesting.value = requestId;
        queryPreSuggestion = trimmedInput;
        selectedSuggestion.value = -1;
        app.search
          .suggest(trimmedInput)
          .then((s) => {
            if (suggesting.value === requestId) {
              suggestions.value = s;
              suggesting.value = '';
            }
          })
          .catch((e) => {
            getLogger('Search').error(e);
          });
      }, 200);
    } else {
      selectedSuggestion.value = -1;
      suggesting.value = '';
      suggestions.value = [];
      queryPreSuggestion = '';
    }
  };

  const reset = (): void => {
    app.search.clearResults();
    selectedSuggestion.value = -1;
    suggesting.value = '';
    suggestions.value = [];
    queryPreSuggestion = '';
  };

  const search = async (): Promise<void> => {
    reset();
    searching.value = true;
    try {
      if (query.value) {
        await app.search.search(query.value.trim());
      }
    } catch (e) {
      getLogger('Search').error(e as string);
    }
    searching.value = false;
  };

  const fontSize = useFontSize();
  const searchIconSize = computed(() => {
    return fontSize.value + 11;
  });

  const suggestionsComp = computed(() =>
    suggestions.value.map((s) => ({
      title: s,
      clicked(): void {
        query.value = s;
        search().catch((e) => {
          getLogger('Search').error(e);
        });
      },
    })),
  );

  const selectSuggestion = (number: number): void => {
    const newSelection = selectedSuggestion.value + number;
    if (newSelection > -1 && newSelection < suggestions.value?.length) {
      selectedSuggestion.value = newSelection;
      query.value = suggestions.value[newSelection];
    } else {
      selectedSuggestion.value = -1;
      query.value = queryPreSuggestion;
    }
  };
</script>
