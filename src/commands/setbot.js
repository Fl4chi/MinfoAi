verify').setPlaceholder('Verifica: ON/OFF').addOptions({ label:'ON', value:'on' },{ label:'OFF', value:'off' }))));
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('verify_role').setPlaceholder('Ruolo verificato')
              .addOptions(
                ...interaction.guild.roles.cache.filter(r => r.editable && r.name !== '@everyone').map(r => ({ label: `@${r.name}`, value: r.id }))
              )
          ));
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('verify_mode').setPlaceholder('Modalità verifica')
              .addOptions({ label: 'Bottone', value: 'button' }, { label: 'Reazione', value: 'reaction' })
          ));
          break;
      }
      return rows;
    };

    const buildPages = () => {
      const catOrder = ['overview','welcome','goodbye','music','moderation','gamification','giveaway','verify'];
      state.pageIndex = Math.max(0, Math.min(state.pageIndex, catOrder.length - 1));
      state.pages = catOrder.map(cat => renderCategory({ ...state, category: cat }));
    };

    buildPages();

    await interaction.reply({
      embeds: [state.pages[state.pageIndex]],
      components: [buildCategoryMenu(state.category), buildNavButtons()],
      ephemeral: true,
    });

    const msg = await interaction.fetchReply();

    const buttonCollector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60_000 });
    const selectCollector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 5 * 60_000 });

    const ensureAuthor = (i) => i.user.id === interaction.user.id;

    buttonCollector.on('collect', async (i) => {
      try {
        if (!ensureAuthor(i)) return i.reply({ content: 'Questa UI non è per te.', ephemeral: true });
        if (i.customId === 'prev') state.pageIndex = Math.max(0, state.pageIndex - 1);
        if (i.customId === 'next') state.pageIndex = Math.min(state.pages.length - 1, state.pageIndex + 1);
        if (i.customId === 'save') {
          // TODO: Persist state.config to your storage (DB/file). Demo reply for now.
          await i.reply({ content: '✅ Config salvata (demo).', ephemeral: true });
          return;
        }
        if (i.customId === 'close') return buttonCollector.stop('user');
        await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
      } catch (err) { console.error('setbot button error:', err); }
    });

    selectCollector.on('collect', async (i) => {
      try {
        if (!ensureAuthor(i)) return i.reply({ content: 'Questa UI non è per te.', ephemeral: true });
        const val = i.values?.[0];
        if (!val) return i.deferUpdate();
        // category switcher
        if (i.customId === 'category') {
          state.category = val;
          buildPages();
          return i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
        }
        // field updates by category
        switch (i.customId) {
          case 'welcome_enabled': state.config.welcome.enabled = val === 'on'; break;
          case 'welcome_channel': state.config.welcome.channel = val; break;
          case 'welcome_message':
            if (val === 'custom') {
              state.config.welcome.message = 'Scrivi il tuo messaggio con {user} e {server}';
            } else state.config.welcome.message = val; break;
          case 'goodbye_enabled': state.config.goodbye.enabled = val === 'on'; break;
          case 'goodbye_channel': state.config.goodbye.channel = val; break;
          case 'goodbye_message':
            if (val === 'custom') state.config.goodbye.message = 'Scrivi il tuo messaggio di addio'; else state.config.goodbye.message = val; break;
          case 'music_enabled': state.config.music.enabled = val === 'on'; break;
          case 'music_queue': state.config.music.queueLimit = parseInt(val, 10) || 50; break;
          case 'moderation_automod': state.config.moderation.automod = val === 'on'; break;
          case 'moderation_log': state.config.moderation.logChannel = val; break;
          case 'gami_xp': state.config.gamification.xp = val === 'on'; break;
          case 'gami_multiplier': state.config.gamification.multiplier = Number(val); break;
          case 'gami_reward': state.config.gamification.rewardRole = val; break;
          case 'gw_dm': state.config.giveaway.dmWinners = val === 'on'; break;
          case 'gw_channel': state.config.giveaway.channel = val; break;
          case 'verify_enabled': state.config.verify.enabled = val === 'on'; break;
          case 'verify_role': state.config.verify.role = val; break;
          case 'verify_mode': state.config.verify.mode = val; break;
        }
        buildPages();
        await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
      } catch (err) { console.error('setbot select error:', err); }
    });

    const endAll = async () => {
      try { await msg.edit({ components: [] }); } catch {}
    };
    buttonCollector.on('end', endAll);
    selectCollector.on('end', endAll);
  }
};
